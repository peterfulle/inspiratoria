import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const GMAIL_USER = "macarena@inspiratoria.org";
const GMAIL_APP_PASSWORD = "qtuz adee xuos tbbe";
const NOTIFY_TO = "macarena@inspiratoria.org";

// Brand colors
const BRAND = {
  purple: "#7c3aed",
  purpleLight: "#a855f7",
  purpleSoft: "#c084fc",
  purpleBg: "#faf5ff",
  purpleBorder: "#e9d5ff",
  purpleText: "#c4b5fd",
  dark: "#1e1b4b",
  green: "#22c55e",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

interface FormData {
  nombre: string;
  apellido: string;
  cargo: string;
  empresa: string;
  email: string;
  whatsapp: string;
  idea: string;
}

// ─── INTERNAL EMAIL (to PM) ───────────────────────────────────────────
function buildInternalEmailHTML(data: FormData) {
  const fecha = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;width:100%;">

          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.purple} 0%,${BRAND.purpleLight} 50%,${BRAND.purpleSoft} 100%);border-radius:20px 20px 0 0;padding:40px 40px 30px 40px;text-align:center;">
              <img src="cid:inspiratoria-logo" alt="Inspiratoria" style="height:48px;margin-bottom:20px;" />
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">Nueva Solicitud Studio</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">${fecha}</p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff;padding:0;">

              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:24px 40px 0 40px;">
                    <div style="background:${BRAND.purpleBg};border:1px solid ${BRAND.purpleBorder};border-radius:12px;padding:14px 18px;">
                      <span style="font-size:14px;color:${BRAND.purple};font-weight:600;">&#x1f7e3; Un nuevo prospecto quiere desarrollar una idea con Inspiratoria Studio</span>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:24px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                      <tr>
                        <td colspan="2" style="background:#f9fafb;padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;font-weight:600;">Contacto</p>
                          <p style="margin:0;font-size:22px;font-weight:700;color:#111827;">${data.nombre} ${data.apellido}</p>
                          <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${data.cargo} &middot; ${data.empresa}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">&#x1f4e7; Email</p>
                          <a href="mailto:${data.email}" style="font-size:14px;color:${BRAND.purple};text-decoration:none;font-weight:500;">${data.email}</a>
                        </td>
                        <td style="padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">&#x1f4f1; WhatsApp</p>
                          <a href="https://wa.me/${data.whatsapp.replace(/[^0-9]/g, "")}" style="font-size:14px;color:${BRAND.purple};text-decoration:none;font-weight:500;">${data.whatsapp}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 24px;width:50%;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">&#x1f3e2; Empresa</p>
                          <p style="margin:0;font-size:14px;color:#374151;font-weight:500;">${data.empresa}</p>
                        </td>
                        <td style="padding:16px 24px;width:50%;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">&#x1f4bc; Cargo</p>
                          <p style="margin:0;font-size:14px;color:#374151;font-weight:500;">${data.cargo}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px 40px;">
                    <div style="background:linear-gradient(135deg,${BRAND.purpleBg} 0%,#f3e8ff 100%);border:1px solid ${BRAND.purpleBorder};border-radius:16px;padding:24px;">
                      <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.purple};font-weight:700;">&#x1f4a1; Idea a desarrollar</p>
                      <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${data.idea}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px 40px;" align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right:8px;">
                          <a href="mailto:${data.email}" style="display:inline-block;background:${BRAND.purple};color:#ffffff;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
                            Responder por Email
                          </a>
                        </td>
                        <td style="padding-left:8px;">
                          <a href="https://wa.me/${data.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${data.nombre}, soy del equipo de Inspiratoria Studio. Recibimos tu solicitud y nos encantar\u00eda conversar sobre tu idea. \u00bfTienes disponibilidad esta semana?`)}" style="display:inline-block;background:${BRAND.green};color:#ffffff;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
                            Contactar por WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background:${BRAND.dark};border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);">
                Notificaci&oacute;n autom&aacute;tica de <strong style="color:${BRAND.purpleText};">Inspiratoria Studio</strong>
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">
                Este correo fue generado desde el formulario de registro en inspiratoria.org
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

// ─── CLIENT CONFIRMATION EMAIL (to prospect) ──────────────────────────
function buildClientEmailHTML(data: FormData) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;width:100%;">

          <!-- HEADER WITH LOGO -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.purple} 0%,${BRAND.purpleLight} 50%,${BRAND.purpleSoft} 100%);border-radius:20px 20px 0 0;padding:48px 40px 40px 40px;text-align:center;">
              <img src="cid:inspiratoria-logo" alt="Inspiratoria" style="height:52px;margin-bottom:28px;" />
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">
                &iexcl;Hola ${data.nombre}!
              </h1>
              <p style="margin:10px 0 0;font-size:16px;color:rgba(255,255,255,0.85);line-height:1.5;">
                Recibimos tu solicitud y estamos emocionados<br/>de conocer tu idea
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:0;">

              <!-- Welcome Message -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:32px 40px 24px 40px;">
                    <p style="margin:0;font-size:15px;color:#374151;line-height:1.8;">
                      Gracias por contactar a <strong style="color:${BRAND.purple};">Inspiratoria Studio</strong>. Tu solicitud ha sido recibida exitosamente y un ejecutivo PM de nuestro equipo se pondr&aacute; en contacto contigo en las pr&oacute;ximas <strong>24 horas</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Summary Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 24px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                      <tr>
                        <td style="background:#f9fafb;padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;font-weight:600;">Resumen de tu solicitud</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                            <tr>
                              <td style="padding:6px 0;vertical-align:top;width:120px;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Nombre</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${data.nombre} ${data.apellido}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Cargo</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${data.cargo}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Empresa</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${data.empresa}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Idea recap -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 28px 40px;">
                    <div style="background:linear-gradient(135deg,${BRAND.purpleBg} 0%,#f3e8ff 100%);border:1px solid ${BRAND.purpleBorder};border-radius:16px;padding:24px;">
                      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.purple};font-weight:700;">&#x1f4a1; Tu idea</p>
                      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;font-style:italic;">&ldquo;${data.idea}&rdquo;</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px 40px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Pr&oacute;ximos pasos</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:${BRAND.purple};color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;">1</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Revisi&oacute;n</strong> &mdash; Nuestro equipo analizar&aacute; tu solicitud</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:${BRAND.purpleLight};color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;">2</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Contacto</strong> &mdash; Un ejecutivo PM te contactar&aacute; en 24 horas</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:${BRAND.purpleSoft};color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;">3</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Demo</strong> &mdash; Presentaci&oacute;n personalizada de Inspiratoria Studio</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:#ddd6fe;color:${BRAND.purple};font-size:13px;font-weight:700;text-align:center;line-height:28px;">4</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Dise&ntilde;o</strong> &mdash; Programa de mentor&iacute;a a medida para tu organizaci&oacute;n</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 28px 40px;">
                    <div style="border-top:1px solid #e5e7eb;"></div>
                  </td>
                </tr>
              </table>

              <!-- Contact info -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px 40px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
                      &iquest;Tienes alguna pregunta? Escr&iacute;benos directamente:
                    </p>
                    <a href="mailto:macarena@inspiratoria.org" style="display:inline-block;background:${BRAND.purple};color:#ffffff;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
                      macarena@inspiratoria.org
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:${BRAND.dark};border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
              <img src="cid:inspiratoria-logo" alt="Inspiratoria" style="height:32px;margin-bottom:12px;opacity:0.7;" />
              <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.6);">
                Transformando organizaciones a trav&eacute;s de la mentor&iacute;a
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">
                inspiratoria.org &bull; Santiago, Chile
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

// ─── API HANDLER ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, apellido, cargo, empresa, email, whatsapp, idea } = body;

    if (!nombre || !apellido || !email || !whatsapp || !idea) {
      return NextResponse.json(
        { success: false, error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const formData: FormData = {
      nombre,
      apellido,
      cargo: cargo || "No especificado",
      empresa: empresa || "No especificada",
      email,
      whatsapp,
      idea,
    };

    // Read logo for CID attachment
    const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
    const logoExists = fs.existsSync(logoPath);
    const logoAttachment = logoExists
      ? [{ filename: "logo.png", path: logoPath, cid: "inspiratoria-logo" }]
      : [];

    // 1. Send internal notification to PM
    await transporter.sendMail({
      from: `"Inspiratoria Studio" <${GMAIL_USER}>`,
      to: NOTIFY_TO,
      replyTo: email,
      subject: `🟣 Nueva Solicitud Studio — ${nombre} ${apellido} · ${empresa || "Sin empresa"}`,
      html: buildInternalEmailHTML(formData),
      text: [
        "NUEVA SOLICITUD INSPIRATORIA STUDIO",
        "===================================",
        "",
        `Nombre: ${nombre} ${apellido}`,
        `Cargo: ${cargo}`,
        `Empresa: ${empresa}`,
        `Email: ${email}`,
        `WhatsApp: ${whatsapp}`,
        "",
        "IDEA A DESARROLLAR:",
        idea,
        "",
        "---",
        "Enviado desde el formulario de registro de Inspiratoria Studio",
      ].join("\n"),
      attachments: logoAttachment,
    });

    // 2. Send confirmation email to prospect
    try {
      await transporter.sendMail({
        from: `"Inspiratoria" <${GMAIL_USER}>`,
        to: email,
        subject: `¡Recibimos tu solicitud, ${nombre}! — Inspiratoria Studio`,
        html: buildClientEmailHTML(formData),
        text: [
          `¡Hola ${nombre}!`,
          "",
          "Gracias por contactar a Inspiratoria Studio.",
          "Tu solicitud ha sido recibida exitosamente.",
          "",
          "Un ejecutivo PM de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas.",
          "",
          "RESUMEN DE TU SOLICITUD:",
          `Nombre: ${nombre} ${apellido}`,
          `Cargo: ${cargo}`,
          `Empresa: ${empresa}`,
          "",
          "TU IDEA:",
          idea,
          "",
          "PRÓXIMOS PASOS:",
          "1. Nuestro equipo analizará tu solicitud",
          "2. Un ejecutivo PM te contactará en 24 horas",
          "3. Demo personalizada de Inspiratoria Studio",
          "4. Diseño a medida de tu programa de mentoría",
          "",
          "¿Preguntas? Escríbenos a macarena@inspiratoria.org",
          "",
          "---",
          "Inspiratoria · Transformando organizaciones a través de la mentoría",
          "inspiratoria.org",
        ].join("\n"),
        attachments: logoAttachment,
      });
      console.log("✅ Confirmation email sent to:", email);
    } catch (clientErr) {
      console.warn("⚠️ Could not send confirmation to client:", clientErr);
      // Don't fail the whole request if client email fails
    }

    return NextResponse.json(
      { success: true, message: "Solicitud enviada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error enviando email:", error);
    return NextResponse.json(
      { success: false, error: "Error al enviar la solicitud" },
      { status: 500 }
    );
  }
}
