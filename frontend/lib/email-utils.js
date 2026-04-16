/**
 * Email utilities for generating various email formats
 * Supports: .EML files (desktop clients), deep links (web clients), HTML templates
 */

/**
 * Generate .EML file content with embedded image
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body text
 * @param {string} imageBase64 - Base64 encoded image (with or without data URI prefix)
 * @param {string} imageFileName - Name of image file (e.g., "banner.png")
 * @returns {string} .EML file content
 */
export function generateEMLContent(to, subject, body, imageBase64, imageFileName = 'banner.png') {
  // Remove data URI prefix if present
  const imageData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Generate boundary for MIME parts
  const boundary = 'boundary-' + Date.now();
  const textBoundary = 'boundary-text-' + Date.now();
  
  // Clean up email content
  const cleanSubject = subject.replace(/[\r\n]/g, '');
  const cleanBody = body.replace(/\r\n/g, '\n');
  
  const eml = `From: <>`
    + `\r\nTo: ${to}`
    + `\r\nSubject: ${cleanSubject}`
    + `\r\nMIME-Version: 1.0`
    + `\r\nContent-Type: multipart/related; boundary="${boundary}"`
    + `\r\n\r\n`
    + `--${boundary}\r\n`
    + `Content-Type: multipart/alternative; boundary="${textBoundary}"\r\n`
    + `\r\n`
    + `--${textBoundary}\r\n`
    + `Content-Type: text/plain; charset="UTF-8"\r\n`
    + `Content-Transfer-Encoding: 7bit\r\n`
    + `\r\n`
    + `${cleanBody}\r\n`
    + `\r\n`
    + `--${textBoundary}\r\n`
    + `Content-Type: text/html; charset="UTF-8"\r\n`
    + `Content-Transfer-Encoding: base64\r\n`
    + `\r\n`
    + Buffer.from(`<!DOCTYPE html><html><body><img src="cid:banner-image" style="max-width: 100%; height: auto;" />\r\n<p>${cleanBody.replace(/\n/g, '<br>')}</p></body></html>`).toString('base64')
    + `\r\n\r\n`
    + `--${textBoundary}--\r\n`
    + `\r\n`
    + `--${boundary}\r\n`
    + `Content-Type: image/png\r\n`
    + `Content-Transfer-Encoding: base64\r\n`
    + `Content-ID: <banner-image>\r\n`
    + `Content-Disposition: inline; filename="${imageFileName}"\r\n`
    + `\r\n`
    + imageData
    + `\r\n\r\n`
    + `--${boundary}--`;
  
  return eml;
}

/**
 * Download .EML file
 * @param {string} eml - EML content
 * @param {string} fileName - File name (without extension)
 */
export function downloadEML(eml, fileName = 'email') {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(eml));
  element.setAttribute('download', `${fileName}.eml`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Generate deep link for Gmail compose
 * @param {string} subject - Email subject
 * @param {string} body - Email body text
 * @returns {string} Gmail compose URL
 */
export function getGmailLink(subject, body) {
  const params = new URLSearchParams();
  params.append('view', 'cm');
  params.append('fs', '1');
  params.append('su', subject);
  params.append('body', body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Generate deep link for Outlook Web compose
 * @param {string} subject - Email subject
 * @param {string} body - Email body text
 * @returns {string} Outlook Web compose URL
 */
export function getOutlookWebLink(subject, body) {
  const params = new URLSearchParams();
  params.append('subject', subject);
  params.append('body', body);
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

/**
 * Generate deep link for Yahoo Mail compose
 * @param {string} subject - Email subject
 * @param {string} body - Email body text
 * @returns {string} Yahoo Mail compose URL
 */
export function getYahooMailLink(subject, body) {
  const params = new URLSearchParams();
  params.append('subject', subject);
  params.append('body', body);
  return `https://compose.mail.yahoo.com/?${params.toString()}`;
}

/**
 * Generate HTML email template with embedded image
 * @param {string} subject - Email subject
 * @param {string} body - Email body text
 * @param {string} imageBase64 - Full data URI of image
 * @returns {string} HTML content
 */
export function generateHTMLTemplate(subject, body, imageBase64) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .email-container { max-width: 600px; margin: 0 auto; }
    .banner { margin-bottom: 20px; }
    .banner img { max-width: 100%; height: auto; display: block; }
    .content { padding: 20px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="banner">
      <img src="${imageBase64}" alt="Email Header">
    </div>
    <div class="content">
      <p>${body.replace(/\n/g, '<br>')}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Download HTML email template
 * @param {string} html - HTML content
 * @param {string} fileName - File name (without extension)
 */
export function downloadHTML(html, fileName = 'email-template') {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
  element.setAttribute('download', `${fileName}.html`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Get instructions text for web-based email clients
 */
export function getWebClientInstructions() {
  return `For Gmail/Outlook Web/Yahoo Mail:
1. Your compose window will open in a new tab
2. Save and download the banner image from the editor
3. In your email, click "Attach files" and insert the banner image
4. Drag the image to the top of your email body
5. Add your message below the banner`;
}

/**
 * Generate mailto: link (fallback for universal support)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body text
 * @returns {string} mailto: URL
 */
export function getMailtoLink(to = '', subject = '', body = '') {
  const params = new URLSearchParams();
  if (to) params.append('to', to);
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  return `mailto:${params.toString() ? '?' + params.toString() : ''}`;
}
