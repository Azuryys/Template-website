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
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { hashPassword } from 'better-auth/crypto';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

async function ensureAuthSchema() {
  await pool.query(`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS ip_address TEXT`);
  await pool.query(`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS user_agent TEXT`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS name TEXT`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`);
  await pool.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS usertype TEXT DEFAULT 'user'`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recovery_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

await ensureAuthSchema();

// Middleware CORS - permite requisições do frontend (localhost:3000)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// ============================================
// SERVIR AVATARES ESTATICAMENTE
// ============================================
const avatarsDir = join(__dirname, '..', '..', 'public', 'avatars');
await mkdir(avatarsDir, { recursive: true });
app.use('/avatars', express.static(avatarsDir));

// Middleware para parsear JSON nos requests (depois do handler do Better Auth)
app.use(express.json());

async function requireAdminSession(req, res) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return null;
  }

  const role = session.user.role || session.user.usertype;
  const isAdmin = role === 'admin' || role === 'superadmin';
  if (!isAdmin) {
    res.status(403).json({ error: 'Sem permissão de administrador' });
    return null;
  }

  return session;
}

// Rota de health-check - verifica se o backend está rodando
app.get('/', (req, res) => {
  res.send('Backend rodando');
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const result = await pool.query(
      `SELECT id, name, email, role, usertype, created_at
       FROM "user"
       ORDER BY created_at DESC NULLS LAST, email ASC`
    );

    const users = result.rows.map((row) => {
      const role = row.role || row.usertype || 'user';
      return {
        id: row.id,
        name: row.name || 'Sem nome',
        email: row.email,
        role,
        isAdmin: role === 'admin' || role === 'superadmin',
        isSuperAdmin: role === 'superadmin',
        usertype: row.usertype,
        createdAt: row.created_at,
      };
    });

    res.json({ users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const targetUserId = req.params.id;
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID do utilizador é obrigatório' });
    }

    if (targetUserId === session.user.id) {
      return res.status(400).json({ error: 'Não pode apagar a própria conta' });
    }

    const actorRole = session.user.role || session.user.usertype || 'user';
    const actorIsSuperAdmin = actorRole === 'superadmin';

    const targetUserResult = await pool.query(
      'SELECT id, role, usertype FROM "user" WHERE id = $1',
      [targetUserId]
    );

    if (targetUserResult.rowCount === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const targetUser = targetUserResult.rows[0];
    const targetRole = targetUser.role || targetUser.usertype || 'user';
    const targetIsAdmin = targetRole === 'admin' || targetRole === 'superadmin';

    if (targetIsAdmin && !actorIsSuperAdmin) {
      return res.status(403).json({ error: 'Apenas superadmin pode apagar contas admin' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM "session" WHERE user_id = $1', [targetUserId]);
      await client.query('DELETE FROM "account" WHERE user_id = $1', [targetUserId]);

      const result = await client.query('DELETE FROM "user" WHERE id = $1 RETURNING id', [targetUserId]);
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Utilizador não encontrado' });
      }

      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

    res.json({ success: true, message: 'Conta apagada com sucesso' });
  } catch (error) {
    console.error('Erro ao apagar utilizador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/create-user', async (req, res) => {
  try {
    const session = await requireAdminSession(req, res);
    if (!session) return;

    const { name, email, password, role } = req.body;
    const normalizedRole = role || 'user';

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    if (!['user', 'admin', 'superadmin'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    const actorRole = session.user.role || session.user.usertype || 'user';
    if (normalizedRole === 'superadmin' && actorRole !== 'superadmin') {
      return res.status(403).json({ error: 'Apenas superadmin pode criar super admin' });
    }

    const existingUser = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'Email já está registado' });
    }

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split('@')[0],
        role: normalizedRole,
        usertype: normalizedRole,
      },
    });

    res.status(201).json({
      message: 'Utilizador criado com sucesso',
      user: {
        id: result?.user?.id,
        email: result?.user?.email || email,
        role: normalizedRole,
      },
    });
  } catch (error) {
    console.error('Erro ao criar utilizador por admin:', error);
    const message = error?.message || 'Falha ao criar utilizador';
    res.status(500).json({ error: message });
  }
});

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
      'UPDATE "user" SET image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
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
 * POST /api/password/recover
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
app.post('/api/password/recover', async (req, res) => {
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
    await pool.query(
      `INSERT INTO recovery_codes (email, code, used, expires_at)
       VALUES ($1, $2, FALSE, NOW() + INTERVAL '1 hour')`,
      [email, recoveryCode]
    );

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
 * POST /api/password/verify-code
 * FUNÇÃO: Verifica se o código de recuperação é válido
 * RECEBE: { email: string, code: string }
 * RETORNA: { valid: true, codeId: number } ou erro
 * PROCESSO:
 *   1. Procura o código na tabela recovery_codes
 *   2. Verifica se NÃO foi usado (used = FALSE)
 *   3. Verifica se NÃO expirou (expires_at > NOW())
 *   4. Se válido, retorna o ID do código para usar no reset
 */
app.post('/api/password/verify-code', async (req, res) => {
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
 * POST /api/password/reset
 * FUNÇÃO: Marca o código como usado após a alteração de senha
 * RECEBE: { codeId: number }
 * RETORNA: { message: 'Senha alterada com sucesso' } ou erro
 * PROCESSO:
 *   1. Marca o código como usado (used = TRUE)
 *   2. Impede que o mesmo código seja reutilizado
 *   3. Completa o fluxo de recuperação de senha
 */
app.post('/api/password/reset', async (req, res) => {
  try {
    const { email, codeId, newPassword } = req.body;

    if (!email || !codeId || !newPassword) {
      return res.status(400).json({ error: 'Dados incompletos para reset' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const codeResult = await pool.query(
      `SELECT id FROM recovery_codes
       WHERE id = $1
       AND email = $2
       AND used = FALSE
       AND expires_at > NOW()`,
      [codeId, email]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    const userResult = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Utilizador não encontrado' });
    }

    const userId = userResult.rows[0].id;
    const hashedPassword = await hashPassword(newPassword);

    await pool.query('BEGIN');
    await pool.query(
      'UPDATE "account" SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hashedPassword, userId]
    );
    await pool.query(
      'UPDATE "user" SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
    await pool.query('UPDATE recovery_codes SET used = TRUE WHERE id = $1', [codeId]);
    await pool.query('COMMIT');

    // Log de sucesso
    console.log(`✅ Código marcado como usado: ${codeId}`);
    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Erro no rollback:', rollbackError);
    }
    console.error('Erro no reset:', error);
    res.status(500).json({ error: 'Falha ao alterar senha' });
  }
});

// Better Auth - handler para rotas de autenticação
app.all("/api/auth/*", toNodeHandler(auth));

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const PORT = process.env.PORT || 5000;  // Porta 3001 (vem do .env)
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
  console.log(`📁 Avatars: ${avatarsDir}`);
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`⚠️ Porta ${PORT} já está em uso. Já existe um backend em execução.`);
    console.error('➡️ Fecha a instância antiga ou usa outra porta no ficheiro .env (PORT=...).');
    process.exit(1);
  }

  console.error('Erro ao iniciar o servidor:', error);
  process.exit(1);
});