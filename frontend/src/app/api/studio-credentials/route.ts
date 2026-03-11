import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const GMAIL_USER = "macarena@inspiratoria.org";
const GMAIL_APP_PASSWORD = "qtuz adee xuos tbbe";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

interface CredentialsData {
  admin_name: string;
  admin_email: string;
  company_name: string;
  generated_password: string;
  access_hash: string;
  corp_id: string;
  plan: string;
  login_url: string;
  dashboard_url: string;
}

function buildCredentialsEmailHTML(data: CredentialsData) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color:#f8f8f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#111111;border-radius:16px 16px 0 0;padding:48px 40px 40px 40px;text-align:center;">
              <img src="cid:inspiratoria-logo" alt="Inspiratoria" style="height:48px;margin-bottom:24px;" />
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
                Bienvenido a Inspiratoria Studio
              </h1>
              <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.5;">
                Tu cuenta est&aacute; lista, ${data.admin_name}
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:0;">
              
              <!-- Welcome Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:32px 40px 0 40px;">
                    <p style="margin:0;font-size:15px;color:#333333;line-height:1.6;">
                      Hola <strong>${data.admin_name}</strong>,
                    </p>
                    <p style="margin:12px 0 0;font-size:15px;color:#555555;line-height:1.6;">
                      Tu cuenta de administrador para <strong>${data.company_name}</strong> ha sido creada exitosamente.
                      A continuaci&oacute;n encontrar&aacute;s tus credenciales de acceso.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Credentials Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:24px 40px;">
                    <div style="background-color:#f9f9f9;border:1px solid #e5e5e5;border-radius:12px;padding:24px;">
                      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999999;font-weight:600;">Datos de acceso</p>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-top:16px;">
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;">
                            <span style="font-size:13px;color:#999999;">Email</span>
                          </td>
                          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right;">
                            <strong style="font-size:14px;color:#111111;font-family:monospace;">${data.admin_email}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;">
                            <span style="font-size:13px;color:#999999;">Contrase&ntilde;a</span>
                          </td>
                          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right;">
                            <strong style="font-size:14px;color:#111111;font-family:monospace;background:#fff3cd;padding:2px 8px;border-radius:4px;">${data.generated_password}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;">
                            <span style="font-size:13px;color:#999999;">ID Corporativo</span>
                          </td>
                          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right;">
                            <strong style="font-size:14px;color:#111111;">${data.corp_id}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;">
                            <span style="font-size:13px;color:#999999;">Plan</span>
                          </td>
                          <td style="padding:8px 0;text-align:right;">
                            <strong style="font-size:14px;color:#111111;">${data.plan}</strong>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 24px;text-align:center;">
                    <a href="${data.login_url}" style="display:inline-block;background-color:#111111;color:#FFD902;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;">
                      Acceder a mi Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Account Info -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px;">
                    <div style="background-color:#f4f4f4;border-radius:8px;padding:16px;">
                      <p style="margin:0;font-size:12px;color:#999999;">
                        <strong>Hash de acceso:</strong> ${data.access_hash}<br/>
                        <strong>Dashboard:</strong> ${data.dashboard_url}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px;">
                    <p style="margin:0;font-size:13px;color:#999999;line-height:1.5;">
                      &#x1f512; Por seguridad, te recomendamos cambiar tu contrase&ntilde;a despu&eacute;s de tu primer inicio de sesi&oacute;n.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f8f8f8;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbbbbb;">
                Inspiratoria &middot; Plataforma de Mentor&iacute;a y Formaci&oacute;n<br/>
                Este es un correo autom&aacute;tico, por favor no respondas directamente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildNotificationEmailHTML(data: CredentialsData) {
  const fecha = new Date().toLocaleDateString("es-CL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color:#f8f8f8;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" width="560" style="max-width:560px;">
        <tr>
          <td style="background-color:#111111;border-radius:12px 12px 0 0;padding:32px 32px 24px;text-align:center;">
            <h1 style="margin:0;font-size:20px;color:#FFD902;font-weight:700;">Cuenta Studio Creada</h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">${fecha}</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;padding:24px 32px 32px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 16px;font-size:14px;color:#555;">Se ha creado una nueva cuenta Studio:</p>
            <table cellspacing="0" cellpadding="0" width="100%">
              <tr><td style="padding:6px 0;font-size:13px;color:#999;">Empresa</td><td style="padding:6px 0;text-align:right;font-size:14px;color:#111;font-weight:600;">${data.company_name}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#999;">Administrador</td><td style="padding:6px 0;text-align:right;font-size:14px;color:#111;">${data.admin_name}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#999;">Email</td><td style="padding:6px 0;text-align:right;font-size:14px;color:#111;">${data.admin_email}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#999;">ID Corp.</td><td style="padding:6px 0;text-align:right;font-size:14px;color:#111;">${data.corp_id}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#999;">Hash</td><td style="padding:6px 0;text-align:right;font-size:12px;color:#666;font-family:monospace;">${data.access_hash}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const data: CredentialsData = await request.json();

    // Load logo
    let logoPath = path.join(process.cwd(), "public", "images", "Inspiratoria-Logo.png");
    if (!fs.existsSync(logoPath)) {
      logoPath = path.join(process.cwd(), "public", "images", "logo.png");
    }
    
    const attachments: any[] = [];
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: "inspiratoria-logo.png",
        path: logoPath,
        cid: "inspiratoria-logo",
      });
    }

    // 1. Send credentials email to admin
    await transporter.sendMail({
      from: `"Inspiratoria Studio" <${GMAIL_USER}>`,
      to: data.admin_email,
      subject: `Bienvenido a Inspiratoria Studio — ${data.company_name}`,
      html: buildCredentialsEmailHTML(data),
      attachments,
    });

    // 2. Send notification to PM
    await transporter.sendMail({
      from: `"Inspiratoria Platform" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: `Nueva cuenta Studio: ${data.company_name}`,
      html: buildNotificationEmailHTML(data),
      attachments,
    });

    return NextResponse.json({ success: true, message: "Credenciales enviadas" });
  } catch (error: any) {
    console.error("Error sending credentials email:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
