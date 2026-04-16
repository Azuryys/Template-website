export function generateOutlookEML(dataURL) {
  // Extract base64 part exactly
  const parts = dataURL.split(',');
  const base64Data = parts.length > 1 ? parts[1] : parts[0];
  
  const boundary = "----=_NextPart_000_BAUER_TEMPLATE_BOUNDARY";
  const cid = "header-image@template.creator";

  const emlLines = [
    "X-Unsent: 1",
    "Subject: Bauer Template Header Draft",
    "MIME-Version: 1.0",
    `Content-Type: multipart/related; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=\"utf-8\"",
    "Content-Transfer-Encoding: 7bit",
    "",
    "<html>",
    "<body>",
    `<img src="cid:${cid}" alt="Header Image" />`,
    "<br><br>",
    "</body>",
    "</html>",
    "",
    `--${boundary}`,
    "Content-Type: image/png; name=\"header.png\"",
    `Content-ID: <${cid}>`,
    "Content-Transfer-Encoding: base64",
    "Content-Disposition: inline; filename=\"header.png\"",
    "",
    base64Data,
    "",
    `--${boundary}--`
  ];

  const emlContent = emlLines.join('\r\n');
  return new Blob([emlContent], { type: 'message/rfc822' });
}