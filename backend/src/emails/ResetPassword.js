export function ResetPassword({ name, url }) {
  const safeName = String(name || '').replace(/[<>]/g, '');
  const safeUrl = String(url || '').replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>Recuperação de Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 20px; }
    .container { max-width: 465px; margin: 40px auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    h1 { color: #111827; font-size: 24px; text-align: center; }
    .button { display: inline-block; background: #dc2626; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    .footer { color: #9ca3af; font-size: 14px; text-align: center; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Recuperação de Password</h1>
    <p>Olá <strong>${safeName}</strong>,</p>
    <p>Recebemos um pedido para redefinir a tua password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${safeUrl}" class="button">Redefinir Password</a>
    </div>
    <p style="color: #991b1b; background: #fef2f2; padding: 16px; border-radius: 6px;">
      Este link expira em 1 hora.
    </p>
    <div class="footer">
      Se não pediste isto, ignora este email.
    </div>
  </div>
</body>
</html>`;
}