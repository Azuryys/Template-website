import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { auth } from '../../auth.js';
import { pool } from './lib/db.js';  // ← importa do db.js (já tem Pool!)

const app = express();

app.use(cors());
app.use(express.json());

// Better Auth
app.all("/api/auth/*", auth.handler);

// ============================================
// ROTAS CUSTOM - usa o mesmo pool
// ============================================

// POST /api/auth/recover
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    // usa o pool importado do db.js
    await pool.query(
      `INSERT INTO recovery_codes (email, code, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [email, recoveryCode]
    );

    console.log(`📧 EMAIL: ${email} | 🔑 CÓDIGO: ${recoveryCode}`);

    res.json({ message: 'Código enviado' });

  } catch (error) {
    console.error('Erro no recover:', error);
    res.status(500).json({ error: 'Falha ao processar' });
  }
});

// POST /api/auth/verify-code
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    const result = await pool.query(  // ← usa o mesmo pool
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

    res.json({ 
      valid: true, 
      codeId: result.rows[0].id 
    });

  } catch (error) {
    console.error('Erro no verify:', error);
    res.status(500).json({ error: 'Erro na verificação' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { codeId } = req.body;

    await pool.query(  // ← usa o mesmo pool
      'UPDATE recovery_codes SET used = TRUE WHERE id = $1',
      [codeId]
    );

    console.log(`✅ Código marcado como usado: ${codeId}`);
    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro no reset:', error);
    res.status(500).json({ error: 'Falha ao alterar senha' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend: http://localhost:${PORT}`);
});