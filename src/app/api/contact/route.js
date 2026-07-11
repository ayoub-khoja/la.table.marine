import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import { getOrderEmailAttachment } from "@library/email/order";
import { renderContactEmailHtml } from "@library/email/contact";
import { createMessage } from "@library/messages/store";

const attempts = new Map();
const RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_CHARS = 3000;
const ADMIN_EMAIL_FALLBACK = "contact@latablemarine.com";

function getClientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(request) {
  const key = getClientKey(request);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT.windowMs) {
    attempts.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT.max) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}

function getMailConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const to = process.env.CONTACT_TO?.trim() || ADMIN_EMAIL_FALLBACK;
  const from = process.env.CONTACT_FROM?.trim() || user || ADMIN_EMAIL_FALLBACK;

  if (!host || !user || !pass) return null;
  if (!to || !from) return null;

  return { host, port, user, pass, to, from };
}

export async function POST(request) {
  try {
    const rate = checkRateLimit(request);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot (anti-spam): champ caché côté UI
    const hp = (body?.website || "").toString().trim();
    if (hp) {
      return NextResponse.json({ success: true, emailSent: false });
    }

    const first_name = (body?.first_name || "").toString().trim();
    const last_name = (body?.last_name || "").toString().trim();
    const name = (body?.name || "").toString().trim();
    const email = (body?.email || "").toString().trim();
    const phone = (body?.phone || "").toString().trim();
    const message = (body?.message || "").toString().trim();

    let resolvedFirst = first_name;
    let resolvedLast = last_name;

    if (!resolvedFirst && !resolvedLast && name) {
      const parts = name.split(/\s+/);
      resolvedFirst = parts[0] || "";
      resolvedLast = parts.slice(1).join(" ") || "";
    }

    const fullName = `${resolvedFirst} ${resolvedLast}`.trim() || name;

    if (!fullName || !email || !phone || !message) {
      return NextResponse.json(
        { success: false, error: "Merci de remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Adresse e-mail invalide." },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        {
          success: false,
          error: `Message trop long (max ${MAX_MESSAGE_CHARS} caractères).`,
        },
        { status: 400 }
      );
    }

    const payload = {
      first_name: resolvedFirst,
      last_name: resolvedLast,
      fullName,
      email,
      phone,
      message,
    };

    const stored = await createMessage(payload);

    const mailConfig = getMailConfig();
    if (!mailConfig) {
      return NextResponse.json({ success: true, emailSent: false });
    }

    const transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.port === 465,
      auth: {
        user: mailConfig.user,
        pass: mailConfig.pass,
      },
    });

    const headerImagePath = path.join(
      process.cwd(),
      "public",
      "img",
      "header-email.png"
    );

    const attachments = [getOrderEmailAttachment(headerImagePath)];
    const emailData = { ...stored };

    try {
      await Promise.all([
        transporter.sendMail({
          from: `"Contact" <${mailConfig.from}>`,
          to: mailConfig.to,
          subject: "Nouveau message (site web)",
          replyTo: email,
          attachments,
          html: renderContactEmailHtml("admin", emailData),
        }),
        transporter.sendMail({
          from: `"La Table Marine" <${mailConfig.from}>`,
          to: email,
          subject: "Confirmation de votre message — La Table Marine",
          replyTo: mailConfig.to,
          attachments,
          html: renderContactEmailHtml("customer", emailData),
        }),
      ]);
      return NextResponse.json({ success: true, emailSent: true });
    } catch (mailError) {
      console.error("[api/contact] email failed", mailError);
      return NextResponse.json({ success: true, emailSent: false });
    }
  } catch (error) {
    console.error("[api/contact]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
