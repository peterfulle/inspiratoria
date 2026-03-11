const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'macarena@inspiratoria.org',
    pass: 'qtuz adee xuos tbbe',
  },
});

const fecha = new Date().toLocaleDateString('es-CL', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit'
});

const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#c084fc 100%);border-radius:20px 20px 0 0;padding:40px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:16px;padding:12px 16px;margin-bottom:20px;">
            <span style="font-size:24px;font-weight:800;color:#fff;">I</span>
            <span style="font-size:18px;font-weight:600;color:rgba(255,255,255,0.9);margin-left:8px;">Inspiratoria</span>
          </div>
          <h1 style="margin:0;font-size:26px;font-weight:700;color:#fff;">Nueva Solicitud Studio</h1>
          <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">${fecha}</p>
        </td></tr>
        <tr><td style="background:#fff;padding:24px 40px;">
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:14px 18px;margin-bottom:20px;">
            <span style="font-size:14px;color:#7c3aed;font-weight:600;">&#x1f7e3; Un nuevo prospecto quiere desarrollar una idea con Inspiratoria Studio</span>
          </div>
          <table style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;width:100%;">
            <tr><td colspan="2" style="background:#f9fafb;padding:20px 24px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;font-weight:600;">Contacto</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#111827;">Test User Prueba</p>
              <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">CTO &middot; Empresa Demo</p>
            </td></tr>
            <tr>
              <td style="padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">Email</p>
                <a href="mailto:test@demo.com" style="font-size:14px;color:#7c3aed;text-decoration:none;">test@demo.com</a>
              </td>
              <td style="padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">WhatsApp</p>
                <a href="https://wa.me/56912345678" style="font-size:14px;color:#7c3aed;text-decoration:none;">+56 9 1234 5678</a>
              </td>
            </tr>
          </table>
          <div style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border:1px solid #e9d5ff;border-radius:16px;padding:24px;margin-top:20px;">
            <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#7c3aed;font-weight:700;">&#x1f4a1; Idea a desarrollar</p>
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">Esta es una prueba del formulario de Inspiratoria Studio. Queremos desarrollar un programa de mentoría para líderes emergentes en nuestra organización.</p>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="mailto:test@demo.com" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;margin-right:8px;">Responder por Email</a>
            <a href="https://wa.me/56912345678" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">Contactar por WhatsApp</a>
          </div>
        </td></tr>
        <tr><td style="background:#1e1b4b;border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);">Notificaci&oacute;n autom&aacute;tica de <strong style="color:#c4b5fd;">Inspiratoria Studio</strong></p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">Email de prueba desde el formulario de registro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

transporter.sendMail({
  from: '"Inspiratoria Studio" <macarena@inspiratoria.org>',
  to: 'macarena@inspiratoria.org',
  replyTo: 'test@demo.com',
  subject: '\uD83D\uDFE3 [TEST] Nueva Solicitud Studio \u2014 Test User \u00b7 Empresa Demo',
  html: html,
  text: 'TEST - Nueva solicitud studio de Test User de Empresa Demo.',
}).then(info => {
  console.log('Email enviado exitosamente!');
  console.log('Message ID:', info.messageId);
  console.log('Revisa la bandeja de macarena@inspiratoria.org');
}).catch(err => {
  console.error('Error enviando:', err.message);
});
