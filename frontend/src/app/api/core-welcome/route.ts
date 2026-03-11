import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const GMAIL_USER = "macarena@inspiratoria.org";
const GMAIL_APP_PASSWORD = "qtuz adee xuos tbbe";
const NOTIFY_TO = "macarena@inspiratoria.org";

const BRAND = {
  primary: "#a3e635",
  primaryDark: "#65a30d",
  purple: "#7c3aed",
  dark: "#1e1b4b",
  darkAlt: "#111827",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  border: "#e5e7eb",
};

const PLAN_NAMES: Record<string, string> = {
  core_50: "Core 50 — Hasta 50 participantes",
  core_120: "Core 120 — Hasta 120 participantes",
  core_300: "Core 300 — Hasta 300 participantes",
  core_enterprise: "Core Enterprise — +300 participantes",
};

const PLAN_PRICES: Record<string, string> = {
  core_50: "$790.000 CLP/mes",
  core_120: "$1.290.000 CLP/mes",
  core_300: "$2.490.000 CLP/mes",
  core_enterprise: "$3.500.000 CLP/mes",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

interface WelcomeData {
  admin_name: string;
  admin_email: string;
  company_name: string;
  plan_tier: string;
  password: string;
  login_url: string;
}

// ─── WELCOME EMAIL TO NEW CORE USER ──────────────────────────────────
function buildWelcomeEmailHTML(data: WelcomeData) {
  const planName = PLAN_NAMES[data.plan_tier] || data.plan_tier;
  const planPrice = PLAN_PRICES[data.plan_tier] || "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%);border-radius:20px 20px 0 0;padding:48px 40px 40px 40px;text-align:center;">
              <img src="cid:inspiratoria-logo" alt="Inspiratoria" style="height:52px;margin-bottom:28px;" />
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">
                &iexcl;Bienvenido a Inspiratoria Core!
              </h1>
              <p style="margin:10px 0 0;font-size:16px;color:rgba(255,255,255,0.75);line-height:1.5;">
                Tu cuenta est&aacute; lista, ${data.admin_name}
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:0;">

              <!-- Welcome -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:32px 40px 20px 40px;">
                    <p style="margin:0;font-size:15px;color:#374151;line-height:1.8;">
                      Hemos creado tu cuenta en <strong style="color:${BRAND.purple};">Inspiratoria Core</strong> para la empresa <strong>${data.company_name}</strong>. A continuaci&oacute;n encontrar&aacute;s tus credenciales de acceso a la plataforma.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Credentials Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 24px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border:2px solid ${BRAND.purple};border-radius:16px;overflow:hidden;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);padding:16px 24px;">
                          <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.5px;">&#x1f510; Tus Credenciales de Acceso</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:24px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                            <tr>
                              <td style="padding:8px 0;vertical-align:top;width:100px;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Email</p>
                              </td>
                              <td style="padding:8px 0;">
                                <p style="margin:0;font-size:15px;color:#111827;font-weight:600;font-family:monospace;background:#f3f4f6;padding:8px 12px;border-radius:8px;">${data.admin_email}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:8px 0;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Contrase&ntilde;a</p>
                              </td>
                              <td style="padding:8px 0;">
                                <p style="margin:0;font-size:15px;color:#111827;font-weight:600;font-family:monospace;background:#fef3c7;padding:8px 12px;border-radius:8px;border:1px dashed #f59e0b;">${data.password}</p>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:16px 0 0;font-size:12px;color:#ef4444;font-weight:500;">
                            &#x26a0;&#xfe0f; Te recomendamos cambiar tu contrase&ntilde;a despu&eacute;s del primer ingreso
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Plan Info -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 24px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                      <tr>
                        <td style="background:#f9fafb;padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;font-weight:600;">Datos de tu cuenta</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                            <tr>
                              <td style="padding:6px 0;width:120px;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Empresa</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${data.company_name}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Plan</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${planName}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Inversi&oacute;n</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${planPrice}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Administrador</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">${data.admin_name}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;vertical-align:top;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Contrato</p>
                              </td>
                              <td style="padding:6px 0;">
                                <p style="margin:0;font-size:14px;color:#111827;font-weight:500;">Anual (12 meses)</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 16px 40px;" align="center">
                    <a href="${data.login_url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);color:#ffffff;padding:16px 48px;border-radius:14px;font-size:16px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(124,58,237,0.4);">
                      Ingresar a la Plataforma &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px 40px;" align="center">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">${data.login_url}</p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px 40px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Primeros pasos en la plataforma</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:${BRAND.purple};color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;">1</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Inicia sesi&oacute;n</strong> &mdash; Accede con tus credenciales</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:#8b5cf6;color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;">2</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Explora tu Dashboard</strong> &mdash; Conoce tu panel de control</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:#a78bfa;color:#fff;font-size:13px;font-weight:700;text-align:center;line-height:28px;">3</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Crea tu primer programa</strong> &mdash; Dise&ntilde;a tu programa de mentor&iacute;a</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;vertical-align:top;width:36px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:#c4b5fd;color:${BRAND.purple};font-size:13px;font-weight:700;text-align:center;line-height:28px;">4</div>
                        </td>
                        <td style="padding:10px 0 10px 12px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;color:#374151;"><strong>Invita participantes</strong> &mdash; Invita mentores y mentees</p>
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

              <!-- Support -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 40px 32px 40px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
                      &iquest;Necesitas ayuda? Nuestro equipo est&aacute; disponible:
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

// ─── INTERNAL NOTIFICATION (to PM) ────────────────────────────────────
function buildInternalNotificationHTML(data: WelcomeData) {
  const planName = PLAN_NAMES[data.plan_tier] || data.plan_tier;
  const planPrice = PLAN_PRICES[data.plan_tier] || "";
  const fecha = new Date().toLocaleDateString("es-CL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f1fb;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color:#f4f1fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#10b981 50%,#34d399 100%);border-radius:20px 20px 0 0;padding:40px;text-align:center;">
              <img src="cid:inspiratoria-logo" alt="Inspiratoria" style="height:44px;margin-bottom:20px;" />
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">&#x1f389; Nueva Cuenta Core Creada</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">${fecha}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:32px 40px;">
              <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px 18px;margin-bottom:24px;">
                <span style="font-size:14px;color:#065f46;font-weight:600;">&#x2705; Una empresa se ha registrado en Inspiratoria Core</span>
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#f9fafb;padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${data.company_name}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${planName} &bull; ${planPrice}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;"><strong>Admin:</strong> ${data.admin_name}</p>
                    <p style="margin:0 0 6px;font-size:13px;"><strong>Email:</strong> <a href="mailto:${data.admin_email}" style="color:#7c3aed;">${data.admin_email}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#1e1b4b;border-radius:0 0 20px 20px;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">Notificaci&oacute;n autom&aacute;tica de Inspiratoria Core</p>
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
    const { admin_name, admin_email, company_name, plan_tier, password } = body;

    if (!admin_name || !admin_email || !company_name || !plan_tier || !password) {
      return NextResponse.json(
        { success: false, error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Determine login URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const login_url = `${protocol}://${host}/login`;

    const formData: WelcomeData = {
      admin_name,
      admin_email,
      company_name,
      plan_tier,
      password,
      login_url,
    };

    // Logo CID attachment
    const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
    const logoExists = fs.existsSync(logoPath);
    const logoAttachment = logoExists
      ? [{ filename: "logo.png", path: logoPath, cid: "inspiratoria-logo" }]
      : [];

    // 1. Send welcome email to new user
    await transporter.sendMail({
      from: `"Inspiratoria" <${GMAIL_USER}>`,
      to: admin_email,
      subject: `¡Bienvenido a Inspiratoria Core, ${admin_name}! — Tus credenciales de acceso`,
      html: buildWelcomeEmailHTML(formData),
      text: [
        `¡Bienvenido a Inspiratoria Core, ${admin_name}!`,
        "",
        `Tu cuenta para ${company_name} está lista.`,
        "",
        "CREDENCIALES DE ACCESO:",
        `Email: ${admin_email}`,
        `Contraseña: ${password}`,
        "",
        `Ingresa aquí: ${login_url}`,
        "",
        `Plan: ${PLAN_NAMES[plan_tier] || plan_tier}`,
        `Inversión: ${PLAN_PRICES[plan_tier] || ""}`,
        "",
        "PRIMEROS PASOS:",
        "1. Inicia sesión con tus credenciales",
        "2. Explora tu Dashboard",
        "3. Crea tu primer programa de mentoría",
        "4. Invita mentores y mentees",
        "",
        "¿Necesitas ayuda? macarena@inspiratoria.org",
        "",
        "---",
        "Inspiratoria · Transformando organizaciones a través de la mentoría",
      ].join("\n"),
      attachments: logoAttachment,
    });

    console.log("✅ Welcome email sent to:", admin_email);

    // 2. Notify PM about new registration
    try {
      await transporter.sendMail({
        from: `"Inspiratoria Core" <${GMAIL_USER}>`,
        to: NOTIFY_TO,
        replyTo: admin_email,
        subject: `🟢 Nueva Cuenta Core — ${company_name} · ${admin_name}`,
        html: buildInternalNotificationHTML(formData),
        text: [
          "NUEVA CUENTA INSPIRATORIA CORE",
          "==============================",
          "",
          `Empresa: ${company_name}`,
          `Plan: ${PLAN_NAMES[plan_tier] || plan_tier}`,
          `Admin: ${admin_name}`,
          `Email: ${admin_email}`,
          "",
          "---",
          "Registro automático desde inspiratoria.org",
        ].join("\n"),
        attachments: logoAttachment,
      });
    } catch (err) {
      console.warn("⚠️ Could not send internal notification:", err);
    }

    return NextResponse.json(
      { success: true, message: "Email de bienvenida enviado" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error enviando welcome email:", error);
    return NextResponse.json(
      { success: false, error: "Error al enviar email" },
      { status: 500 }
    );
  }
}
