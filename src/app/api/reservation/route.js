import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import { getOrderEmailAttachment } from "@library/email/order";
import { renderReservationEmailHtml } from "@library/email/reservation";
import { createReservation } from "@library/reservations/store";

const attempts = new Map();
const RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };

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
  const to = process.env.CONTACT_TO?.trim() || user;
  const from = process.env.CONTACT_FROM?.trim() || user;

  if (!host || !user || !pass) return null;
  if (!to || !from) return null;

  return { host, port, user, pass, to, from };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const mailConfig = getMailConfig();
    if (!mailConfig) {
      return NextResponse.json(
        { success: false, error: "E-mail non configuré sur le serveur." },
        { status: 503 }
      );
    }

    const rate = checkRateLimit(request);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const first_name = (body?.first_name || "").toString().trim();
    const last_name = (body?.last_name || "").toString().trim();
    const email = (body?.email || "").toString().trim();
    const person = (body?.person || "").toString().trim();
    const date = (body?.date || "").toString().trim();
    const time = (body?.time || "").toString().trim();
    const message = (body?.message || "").toString().trim();

    if (
      !first_name ||
      !last_name ||
      !email ||
      !person ||
      !date ||
      !time ||
      !message
    ) {
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

    const fullName = `${first_name} ${last_name}`.trim();
    const reservation = {
      first_name,
      last_name,
      fullName,
      email,
      person,
      date,
      time,
      message,
    };

    const stored = await createReservation(reservation);

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

    await Promise.all([
      transporter.sendMail({
        from: `"Réservation" <${mailConfig.from}>`,
        to: mailConfig.to,
        subject: "Nouvelle réservation (site web)",
        replyTo: email,
        attachments,
        html: renderReservationEmailHtml("admin", emailData),
      }),
      transporter.sendMail({
        from: `"La Table Marine" <${mailConfig.from}>`,
        to: email,
        subject: "Confirmation de votre réservation — La Table Marine",
        replyTo: mailConfig.to,
        attachments,
        html: renderReservationEmailHtml("customer", emailData),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/reservation]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
