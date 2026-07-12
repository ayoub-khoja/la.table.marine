import dns from "node:dns/promises";
import nodemailer from "nodemailer";

const ADMIN_EMAIL_FALLBACK = "contact@latablemarine.com";
/** IP Cloudflare de smtp.hostinger.com — évite getaddrinfo EDNS/EBUSY sur Vercel */
const HOSTINGER_SMTP_IP = "172.65.255.143";

/** @type {Map<string, { ip: string, at: number }>} */
const hostIpCache = new Map();

function normalizeEnv(value) {
  if (!value) return "";
  const cleaned = value.trim().replace(/^["']|["']$/g, "");
  return cleaned.split(/\r?\n/)[0].trim();
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
 * Résout l'hôte SMTP en IP sans déclencher EDNS/EBUSY sur Vercel.
 * @param {string} hostname
 */
async function resolveSmtpHostAddress(hostname) {
  const envIp = normalizeEnv(process.env.SMTP_HOST_IP);
  if (envIp) return envIp;

  const cached = hostIpCache.get(hostname);
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) {
    return cached.ip;
  }

  if (process.env.VERCEL && hostname === "smtp.hostinger.com") {
    hostIpCache.set(hostname, { ip: HOSTINGER_SMTP_IP, at: Date.now() });
    return HOSTINGER_SMTP_IP;
  }

  try {
    const { address } = await dns.lookup(hostname, { family: 4 });
    hostIpCache.set(hostname, { ip: address, at: Date.now() });
    return address;
  } catch {
    if (hostname === "smtp.hostinger.com") {
      hostIpCache.set(hostname, { ip: HOSTINGER_SMTP_IP, at: Date.now() });
      return HOSTINGER_SMTP_IP;
    }
    throw new Error(`Impossible de résoudre ${hostname}`);
  }
}

/**
 * @param {ReturnType<typeof getMailConfig>} mailConfig
 */
export async function createMailTransporter(mailConfig) {
  const secure = mailConfig.port === 465;
  const hostAddress = await resolveSmtpHostAddress(mailConfig.host);

  return nodemailer.createTransport({
    host: hostAddress,
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
  });
}

/**
 * @param {ReturnType<typeof getMailConfig>} mailConfig
 */
export async function verifyMailTransport(mailConfig) {
  const transporter = await createMailTransporter(mailConfig);
  await transporter.verify();
  return transporter;
}

/**
 * @param {import('nodemailer').Transporter} transporter
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
