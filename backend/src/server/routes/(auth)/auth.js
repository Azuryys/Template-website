const express = require('express');
const router = express.Router();
const { generateRecoveryCode, saveRecoveryCode } = require('../lib/auth');
const { sendRecoveryEmail } = require('../lib/email');

// POST /api/auth/recover
router.post('/recover', async (req, res) => {
   console.log('🔔 sendResetPassword chamado!');
    console.log('User:', user.email);
    console.log('URL:', url);
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email válido é obrigatório' });
    }

    // Generate 6-digit code
    const recoveryCode = generateRecoveryCode();
    
    // Save to database
    await saveRecoveryCode(email, recoveryCode);

    // Send email
    await sendRecoveryEmail(email, recoveryCode);

    console.log(`📧 Código para ${email}: ${recoveryCode}`);

    // Security: always return success (don't reveal if email exists)
    res.json({ message: 'Código enviado' });

  } catch (error) {
    console.error('Erro na recuperação:', error);
    res.status(500).json({ error: 'Falha ao processar solicitação' });
  }
});

module.exports = router;