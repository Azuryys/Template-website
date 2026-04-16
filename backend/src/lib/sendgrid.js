import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import { ENV } from '../config/env.js';

const hasSendGridKey = Boolean(ENV.SENDGRID_API_KEY && !ENV.SENDGRID_API_KEY.includes('your_api_key_here'));
const hasResendKey = Boolean(ENV.RESEND_API_KEY);
const resend = hasResendKey ? new Resend(ENV.RESEND_API_KEY) : null;

if (hasSendGridKey) {
  sgMail.setApiKey(ENV.SENDGRID_API_KEY);
}

/**
 * Inicializa SendGrid com a API Key
 * @param {string} apiKey - SendGrid API Key
 */
export const initSendGrid = (apiKey) => {
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
};

/**
 * Envia um email via SendGrid
 * @param {Object} options - Opções de email
 * @param {string} options.to - Destinatário do email
 * @param {string} options.subject - Assunto do email
 * @param {string} options.html - Conteúdo HTML do email
 * @param {string} options.from - Email remetente (opcional)
 * @returns {Promise} Resultado do envio
 */
export const sendEmail = async ({ to, subject, html, from = ENV.SENDGRID_FROM_EMAIL || ENV.RESEND_FROM_EMAIL || 'noreply@template-website.com' }) => {
  try {
    if (hasSendGridKey) {
      try {
        const response = await sgMail.send({
          to,
          from,
          subject,
          html,
        });

        console.log(`✅ Email enviado para ${to} via SendGrid`);
        return response;
      } catch (sendGridError) {
        const code = sendGridError?.code;
        const isForbidden = code === 403;

        if (isForbidden && resend) {
          console.warn(`SendGrid recusou envio (403). A tentar fallback via Resend para ${to}...`);

          const fallbackResponse = await resend.emails.send({
            from: ENV.RESEND_FROM_EMAIL || from,
            to,
            subject,
            html,
          });

          console.log(`✅ Email enviado para ${to} via Resend (fallback)`);
          return fallbackResponse;
        }

        throw sendGridError;
      }
    }

    if (resend) {
      const response = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      console.log(`✅ Email enviado para ${to} via Resend`);
      return response;
    }

    throw new Error('Nenhum serviço de email está configurado. Defina SENDGRID_API_KEY ou RESEND_API_KEY no .env');
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${to}:`, error.message);
    throw error;
  }
};

/**
 * Envia um email de recuperação de senha
 * @param {Object} options - Opções
 * @param {string} options.to - Email do utilizador
 * @param {string} options.name - Nome do utilizador
 * @param {string} options.url - URL de reset de password
 * @param {string} options.htmlTemplate - Template HTML (opcional)
 */
export const sendPasswordResetEmail = async ({ to, name, url, htmlTemplate }) => {
  const subject = 'Recuperação de Password';
  const html = htmlTemplate || `
    <h1>Olá ${name}!</h1>
    <p>Recebemos um pedido para recuperar a sua password.</p>
    <p><a href="${url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Recuperar Password</a></p>
    <p>Se não solicitou este email, pode ignorar esta mensagem.</p>
  `;

  return sendEmail({ to, subject, html });
};

/**
 * Envia o código de recuperação de senha por email
 * @param {Object} options - Opções
 * @param {string} options.to - Email do utilizador
 * @param {string} options.name - Nome do utilizador
 * @param {string} options.code - Código de 6 dígitos
 */
export const sendRecoveryCodeEmail = async ({ to, name, code }) => {
  const subject = 'Código de Recuperação de Senha';
  const html = `
    <h1>Olá ${name}!</h1>
    <p>Recebemos um pedido para recuperar a sua senha.</p>
    <p>O seu código é:</p>
    <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 16px 0; text-align: center;">${code}</div>
    <p>Este código expira em 1 hora.</p>
    <p>Se não pediu esta recuperação, pode ignorar este email.</p>
  `;

  return sendEmail({ to, subject, html });
};

/**
 * Envia um email de teste apenas para o endereço configurado para testes.
 * O destinatário é fixo por segurança.
 */
export const sendTestEmail = async ({ subject, html }) => {
  const testRecipient = ENV.SENDGRID_TEST_TO_EMAIL || 'nascimentoxdavid@gmail.com';
  const testSubject = subject || 'Teste SendGrid';
  const testHtml = html || '<p>Este é um email de teste.</p>';

  return sendEmail({
    to: testRecipient,
    subject: testSubject,
    html: testHtml,
  });
};

/**
 * Envia um email de verificação de email
 * @param {Object} options - Opções
 * @param {string} options.to - Email do utilizador
 * @param {string} options.name - Nome do utilizador
 * @param {string} options.url - URL de verificação
 * @param {string} options.htmlTemplate - Template HTML (opcional)
 */
export const sendVerificationEmail = async ({ to, name, url, htmlTemplate }) => {
  const subject = 'Verifique o seu email';
  const html = htmlTemplate || `
    <h1>Bem-vindo ${name}!</h1>
    <p>Clique no link abaixo para verificar o seu email:</p>
    <p><a href="${url}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar Email</a></p>
  `;

  return sendEmail({ to, subject, html });
};

