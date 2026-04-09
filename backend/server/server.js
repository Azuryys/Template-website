/**
 * Servidor Express - API de Autenticação
 * 
 * Rotas de recuperação de senha:
 * - POST /api/auth/recover      → Gera e envia código
 * - POST /api/auth/verify-code  → Valida código
 * - POST /api/auth/reset-password → Atualiza senha
 * 
 * Banco de dados: PostgreSQL
 * Tabela: recovery_codes
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors()); // Permite requisições do frontend
app.use(express.json()); // Parse JSON body

// Conexão PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bannercreator',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// ============================================
// POST /api/auth/recover
// ============================================
/**
 * Gera código de 6 dígitos e salva no banco
 * 
 * @body { email: string }
 * @returns { message: string }
 * 
 * O código expira em 1 hora (expires_at)
 * Em produção: enviar email real (SendGrid, AWS SES)
 */
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { email } = req.body;

    // Validação básica de email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    // Gera código aleatório de 6 dígitos (100000-999999)
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Salva no PostgreSQL com expiração de 1 hora
    await pool.query(
      `INSERT INTO recovery_codes (email, code, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [email, recoveryCode]
    );

    // TODO: Substituir por envio de email real
    console.log('========================================');
    console.log(`📧 EMAIL: ${email}`);
    console.log(`🔑 CÓDIGO: ${recoveryCode}`);
    console.log(`⏰ EXPIRA: 1 hora`);
    console.log('========================================');

    // Sempre retorna sucesso (não revela se email existe)
    res.json({ message: 'Código enviado' });

  } catch (error) {
    console.error('Erro no recover:', error);
    res.status(500).json({ error: 'Falha ao processar' });
  }
});

// ============================================
// POST /api/auth/verify-code
// ============================================
/**
 * Verifica se código é válido e não expirou
 * 
 * @body { email: string, code: string }
 * @returns { valid: boolean, codeId: number }
 * 
 * Código deve:
 * - Existir no banco
 - Não ter sido usado (used = false)
 * - Não ter expirado (expires_at > NOW())
 */
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    // Busca código válido no banco
    const result = await pool.query(
      `SELECT * FROM recovery_codes 
       WHERE email = $1 
       AND code = $2 
       AND used = FALSE 
       AND expires_at > NOW()`,
      [email, code]
    );

    // Não encontrou = código inválido ou expirado
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    // Retorna ID do código para usar no reset
    res.json({ 
      valid: true, 
      codeId: result.rows[0].id 
    });

  } catch (error) {
    console.error('Erro no verify:', error);
    res.status(500).json({ error: 'Erro na verificação' });
  }
});

// ============================================
// POST /api/auth/reset-password
// ============================================
/**
 * Marca código como usado e "altera" senha
 * 
 * @body { email: string, codeId: number, newPassword: string }
 * @returns { message: string }
 * 
 * TODO: Integrar com Better Auth para atualizar senha real
 */
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, codeId, newPassword } = req.body;

    // Marca código como usado (evita reuso)
    await pool.query(
      'UPDATE recovery_codes SET used = TRUE WHERE id = $1',
      [codeId]
    );

    // TODO: Atualizar senha no Better Auth
    // await auth.updateUserPassword(email, newPassword);
    
    console.log(`✅ Senha alterada: ${email}`);

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro no reset:', error);
    res.status(500).json({ error: 'Falha ao alterar senha' });
  }
});

// Inicia servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
});