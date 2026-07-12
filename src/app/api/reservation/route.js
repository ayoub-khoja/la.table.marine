import { NextResponse } from "next/server";
import { getEmailHeaderAttachments } from "@library/email/order";
import { renderReservationEmailHtml } from "@library/email/reservation";
import {
  createMailTransporter,
  getMailConfig,
  sendMailBatch,
} from "@library/email/mail-config";
import { normalizeCustomerMessage } from "@library/email/message";
import { createReservation } from "@library/reservations/store";

const attempts = new Map();
const RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };
const MAX_MESSAGE_CHARS = 3000;

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const email = (body?.email || "").toString().trim();
    const phone = (body?.phone || "").toString().trim();
    const person = (body?.person || "").toString().trim();
    const date = (body?.date || "").toString().trim();
    const time = (body?.time || "").toString().trim();
    const requestType = (body?.requestType || "").toString().trim();
    const occasion = (body?.occasion || "").toString().trim();
    const serviceType = (body?.serviceType || "").toString().trim();
    const message = normalizeCustomerMessage(
      (body?.message ?? body?.reservation_note ?? "").toString()
    );

    if (
      !first_name ||
      !last_name ||
      !email ||
      !phone ||
      !person ||
      !date ||
      !time
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

    if (message && message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        {
          success: false,
          error: `Message trop long (max ${MAX_MESSAGE_CHARS} caractères).`,
        },
        { status: 400 }
      );
    }

    const fullName = `${first_name} ${last_name}`.trim();
    const reservation = {
      first_name,
      last_name,
      fullName,
      email,
      phone,
      person,
      date,
      time,
      requestType,
      occasion,
      serviceType,
      message,
    };

    const stored = await createReservation(reservation);

    const mailConfig = getMailConfig();
    if (!mailConfig) {
      console.error("[api/reservation] SMTP not configured");
      return NextResponse.json({
        success: true,
        emailSent: false,
        emailReason: "not_configured",
      });
    }

    const transporter = await createMailTransporter(mailConfig);
    const attachments = getEmailHeaderAttachments();
    const emailData = { ...stored };

    try {
      const { sent, results } = await sendMailBatch(transporter, [
        {
          from: `"Réservation" <${mailConfig.from}>`,
          to: mailConfig.to,
          subject: "Nouvelle réservation (site web)",
          replyTo: email,
          attachments,
          html: renderReservationEmailHtml("admin", emailData),
        },
        {
          from: `"La Table Marine" <${mailConfig.from}>`,
          to: email,
          subject: "Confirmation de votre réservation — La Table Marine",
          replyTo: mailConfig.to,
          attachments,
          html: renderReservationEmailHtml("customer", emailData),
        },
      ]);

      if (sent === 0) {
        console.error("[api/reservation] email failed", results);
      } else if (sent < results.length) {
        console.error("[api/reservation] partial email failure", results);
      }

      return NextResponse.json({
        success: true,
        emailSent: sent > 0,
        emailReason: sent > 0 ? undefined : "send_failed",
      });
    } catch (mailError) {
      console.error("[api/reservation] email failed", mailError);
      return NextResponse.json({
        success: true,
        emailSent: false,
        emailReason: "send_failed",
      });
    }
  } catch (error) {
    console.error("[api/reservation]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
