/**
 * BACKEND - Servidor principal da aplicação
 * Porta: 3001
 * Responsável por: Autenticação, recuperação de senha, upload de avatar e rotas da API
 */

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { auth } from '../../auth.js';
import { pool } from './lib/db.js';  // ← importa Pool do db.js (conexão com PostgreSQL)
import { fromNodeHeaders } from 'better-auth/node';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware CORS - permite requisições do frontend (localhost:3000)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
// Middleware para parsear JSON nos requests
app.use(express.json());

// ============================================
// SERVIR AVATARES ESTATICAMENTE
// ============================================
const avatarsDir = join(__dirname, '..', '..', 'public', 'avatars');
await mkdir(avatarsDir, { recursive: true });
app.use('/avatars', express.static(avatarsDir));

// Rota de health-check - verifica se o backend está rodando
app.get('/', (req, res) => {
  res.send('Backend rodando');
});

// Better Auth - comentado por enquanto (causa conflito com rotas customizadas)
// app.all("/api/auth/*", auth.handler);

// ============================================
// ROTAS CUSTOM - UPLOAD DE AVATAR
// ============================================

/**
 * POST /api/user/avatar
 * FUNÇÃO: Fazer upload de foto de perfil
 * RECEBE: { image: string (base64) }
 * RETORNA: { success: true, avatarUrl: string } ou erro
 * AUTENTICAÇÃO: Requer sessão válida do Better Auth
 */
app.post('/api/user/avatar', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    // Verificar autenticação com Better Auth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    // Validar base64
    if (!image.startsWith('data:image')) {
      return res.status(400).json({ error: 'Formato inválido. Use JPG, PNG ou WebP' });
    }

    // Extrair tipo e dados
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Base64 inválido' });
    }

    const [, ext, base64Data] = matches;
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp'];
    
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({ error: 'Tipo não suportado (use JPG, PNG, WebP)' });
    }

    // Verificar tamanho (aproximado ~2MB)
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Imagem demasiado grande (máx 2MB)' });
    }

    // Guardar ficheiro
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = join(avatarsDir, fileName);
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filePath, buffer);

    // URL completa do backend
    const avatarUrl = `http://localhost:${process.env.PORT || 5000}/avatars/${fileName}`;

    // Atualizar na base de dados (tabela user do Better Auth)
    await pool.query(
      'UPDATE "user" SET image = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, session.user.id]
    );

    console.log(`✅ Avatar atualizado: ${session.user.email} → ${fileName}`);

    res.json({ 
      success: true, 
      avatarUrl 
    });

  } catch (error) {
    console.error('Erro no upload de avatar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================
// ROTAS CUSTOM - RECUPERAÇÃO DE SENHA
// Todas as rotas usam o mesmo pool de conexão do PostgreSQL
// ============================================

/**
 * POST /api/auth/recover
 * FUNÇÃO: Gera um código de recuperação de senha
 * RECEBE: { email: string }
 * RETORNA: { message: 'Código enviado' } ou erro
 * PROCESSO:
 *   1. Valida o email (deve conter @)
 *   2. Verifica se o email existe na tabela 'user'
 *   3. Gera um código aleatório de 6 dígitos
 *   4. Salva o código na tabela 'recovery_codes' com validade de 1 hora
 *   5. Loga o email e código no console (para debug)
 */
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { email } = req.body;

    // Validação: email é obrigatório e deve ser válido
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    // Verificação: email deve existir na tabela user (usuário registado)
    const userResult = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Email não existe' });
    }

    // Gera um código aleatório de 6 dígitos (100000-999999)
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Salva o código na base de dados com expiração de 1 hora
    //removido

    // Log para debug - mostra o email e código gerado no console
    console.log(`📧 EMAIL: ${email} | 🔑 CÓDIGO: ${recoveryCode}`);

    // Resposta de sucesso
    res.json({ message: 'Código enviado' });

  } catch (error) {
    // Tratamento de erros não esperados
    console.error('Erro no recover:', error);
    res.status(500).json({ error: 'Falha ao processar' });
  }
});

/**
 * POST /api/auth/verify-code
 * FUNÇÃO: Verifica se o código de recuperação é válido
 * RECEBE: { email: string, code: string }
 * RETORNA: { valid: true, codeId: number } ou erro
 * PROCESSO:
 *   1. Procura o código na tabela recovery_codes
 *   2. Verifica se NÃO foi usado (used = FALSE)
 *   3. Verifica se NÃO expirou (expires_at > NOW())
 *   4. Se válido, retorna o ID do código para usar no reset
 */
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    // Procura o código na base de dados com múltiplas validações
    const result = await pool.query(
      `SELECT * FROM recovery_codes 
       WHERE email = $1             -- email correto
       AND code = $2                -- código correto
       AND used = FALSE             -- código ainda não foi usado
       AND expires_at > NOW()       -- código ainda não expirou`,
      [email, code]
    );

    // Se não encontrou nenhum resultado, código é inválido/expirado
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    // Resposta de sucesso com o ID do código para usar no próximo passo
    res.json({ 
      valid: true, 
      codeId: result.rows[0].id   // ID necessário para o passo de reset
    });

  } catch (error) {
    console.error('Erro no verify:', error);
    res.status(500).json({ error: 'Erro na verificação' });
  }
});

/**
 * POST /api/auth/reset-password
 * FUNÇÃO: Marca o código como usado após a alteração de senha
 * RECEBE: { codeId: number }
 * RETORNA: { message: 'Senha alterada com sucesso' } ou erro
 * PROCESSO:
 *   1. Marca o código como usado (used = TRUE)
 *   2. Impede que o mesmo código seja reutilizado
 *   3. Completa o fluxo de recuperação de senha
 */
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { codeId } = req.body;

    // Atualiza o código para marcá-lo como usado
    await pool.query(
      'UPDATE recovery_codes SET used = TRUE WHERE id = $1',
      [codeId]
    );

    // Log de sucesso
    console.log(`✅ Código marcado como usado: ${codeId}`);
    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro no reset:', error);
    res.status(500).json({ error: 'Falha ao alterar senha' });
  }
});

/**
 * POST /api/auth/register
 * FUNÇÃO: Registar um novo utilizador
 * RECEBE: { email: string, password: string, name: string }
 * RETORNA: { message: 'Utilizador registado com sucesso' } ou erro
 * PROCESSO:
 *   1. Valida o email
 *   2. Verifica se o email já existe
 *   3. Insere o novo utilizador na tabela user
 *   4. Retorna sucesso
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validação: email é obrigatório e deve ser válido
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    // Validação: senha é obrigatória
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    // Verifica se o email já existe na tabela user
    const existingUser = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já está registado' });
    }

    // Insere o novo utilizador (name é opcional)
    await pool.query(
      'INSERT INTO "user" (email) VALUES ($1)',
      [email]
    );

    console.log(`✅ Novo utilizador registado: ${email}`);
    res.json({ message: 'Utilizador registado com sucesso' });

  } catch (error) {
    console.error('Erro no registo:', error);
    res.status(500).json({ error: 'Falha ao registar utilizador' });
  }
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const PORT = process.env.PORT || 5000;  // Porta 3001 (vem do .env)
app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`📁 Avatars: ${avatarsDir}`);
});