const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ============================================
// POST /api/auth/recover - Enviar código
// ============================================
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO recovery_codes (email, code, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [email, recoveryCode]
    );

    console.log('========================================');
    console.log(`📧 EMAIL: ${email}`);
    console.log(`🔑 CÓDIGO: ${recoveryCode}`);
    console.log('========================================');

    res.json({ message: 'Código enviado' });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Falha ao processar' });
  }
});

// ============================================
// POST /api/auth/verify-code - Verificar código
// ============================================
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    const result = await pool.query(
      `SELECT * FROM recovery_codes 
       WHERE email = $1 
       AND code = $2 
       AND used = FALSE 
       AND expires_at > NOW()`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    res.json({ valid: true, codeId: result.rows[0].id });

  } catch (error) {
    res.status(500).json({ error: 'Erro na verificação' });
  }
});

// ============================================
// POST /api/auth/reset-password - Nova senha
// ============================================
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, codeId, newPassword } = req.body;

    await pool.query(
      'UPDATE recovery_codes SET used = TRUE WHERE id = $1',
      [codeId]
    );

    // TODO: Integrar com Better Auth para atualizar senha
    console.log(`✅ Senha alterada: ${email}`);

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    res.status(500).json({ error: 'Falha ao alterar senha' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
});