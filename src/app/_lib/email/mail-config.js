import nodemailer from "nodemailer";
import { lookup as dnsLookup } from "node:dns";

const ADMIN_EMAIL_FALLBACK = "contact@latablemarine.com";

function normalizeEnv(value) {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

export function getMailConfigChecks() {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const portRaw = normalizeEnv(process.env.SMTP_PORT);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const to = normalizeEnv(process.env.CONTACT_TO) || ADMIN_EMAIL_FALLBACK;
  const from = normalizeEnv(process.env.CONTACT_FROM) || user || ADMIN_EMAIL_FALLBACK;
  const port = Number(portRaw || "465");

  return {
    host: Boolean(host),
    port: Boolean(portRaw) && Number.isFinite(port) && port > 0,
    user: Boolean(user),
    pass: Boolean(pass),
    to: Boolean(to),
    from: Boolean(from),
    portValue: port,
    hostValue: host || null,
    userValue: user || null,
    toValue: to || null,
    fromValue: from || null,
  };
}

export function getMailConfig() {
  const checks = getMailConfigChecks();

  if (!checks.host || !checks.user || !checks.pass || !checks.to || !checks.from) {
    return null;
  }

  return {
    host: checks.hostValue,
    port: checks.portValue,
    user: checks.userValue,
    pass: normalizeEnv(process.env.SMTP_PASS),
    to: checks.toValue,
    from: checks.fromValue,
  };
}

/**
 * Transport compatible Hostinger / Vercel (IPv4, timeouts, TLS).
 * @param {ReturnType<typeof getMailConfig>} mailConfig
 */
export function createMailTransporter(mailConfig) {
  const secure = mailConfig.port === 465;

  return nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure,
    requireTLS: !secure,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
      servername: mailConfig.host,
    },
    lookup: (hostname, options, callback) => {
      dnsLookup(hostname, { ...options, family: 4 }, callback);
    },
  });
}

/**
 * @param {ReturnType<typeof getMailConfig>} mailConfig
 */
export async function verifyMailTransport(mailConfig) {
  const transporter = createMailTransporter(mailConfig);
  await transporter.verify();
  return transporter;
}

/**
 * Envoie les e-mails un par un pour ne pas tout faire échouer si l'un rate.
 * @param {Array<import('nodemailer').SendMailOptions>} messages
 */
export async function sendMailBatch(transporter, messages) {
  const results = [];

  for (const message of messages) {
    try {
      const info = await transporter.sendMail(message);
      results.push({ ok: true, to: message.to, messageId: info.messageId });
    } catch (error) {
      results.push({
        ok: false,
        to: message.to,
        error: error instanceof Error ? error.message : String(error),
        code: error?.code || null,
      });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return { sent, total: results.length, results };
}
