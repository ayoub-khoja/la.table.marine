import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import {
  createMailTransporter,
  getMailConfig,
  getMailConfigChecks,
} from "@library/email/mail-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic SMTP (admin uniquement).
 */
export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  const checks = getMailConfigChecks();
  const mailConfig = getMailConfig();

  if (!mailConfig) {
    return NextResponse.json({
      success: false,
      configured: false,
      connected: false,
      checks: {
        SMTP_HOST: checks.host,
        SMTP_PORT: checks.port,
        SMTP_USER: checks.user,
        SMTP_PASS: checks.pass,
        CONTACT_TO: checks.to,
        CONTACT_FROM: checks.from,
      },
      error: "Variables SMTP manquantes sur le serveur.",
    });
  }

  try {
    const transporter = await createMailTransporter(mailConfig);
    await transporter.verify();

    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      host: mailConfig.host,
      port: mailConfig.port,
      user: mailConfig.user,
      from: mailConfig.from,
      to: mailConfig.to,
      message: "Connexion SMTP opérationnelle.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        configured: true,
        connected: false,
        host: mailConfig.host,
        port: mailConfig.port,
        user: mailConfig.user,
        error: error instanceof Error ? error.message : "Erreur SMTP inconnue.",
        code: error?.code || null,
        hint:
          mailConfig.port === 465
            ? "Essayez SMTP_PORT=587 sur Vercel si le port 465 est bloqué."
            : "Vérifiez le mot de passe Hostinger et que l'e-mail existe bien.",
      },
      { status: 503 }
    );
  }
}
