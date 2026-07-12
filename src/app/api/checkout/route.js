import { NextResponse } from "next/server";
import {
  getEmailHeaderAttachments,
  normalizeItems,
  renderOrderEmailHtml,
} from "@library/email/order";
import {
  createMailTransporter,
  getMailConfig,
  sendMailBatch,
} from "@library/email/mail-config";
import { createOrder } from "@library/orders/store";

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

    const firstname = (body?.firstname || "").toString().trim();
    const lastname = (body?.lastname || "").toString().trim();
    const email = (body?.email || "").toString().trim();
    const tel = (body?.tel || "").toString().trim();
    const address = (body?.address || "").toString().trim();
    const city = (body?.city || "").toString().trim();
    const state = (body?.state || "").toString().trim();
    const postcode = (body?.postcode || "").toString().trim();
    const message = (body?.message || "").toString().trim();
    const payment_method = (body?.payment_method || "").toString().trim();
    const items = normalizeItems(body?.items);

    if (!firstname || !lastname || !email || !tel || !address || !city) {
      return NextResponse.json(
        { success: false, error: "Merci de remplir les champs obligatoires." },
        { status: 400 }
      );
    }

    const transporter = await createMailTransporter(mailConfig);
    const attachments = getEmailHeaderAttachments();

    const fullName = `${firstname} ${lastname}`.trim();
    const order = {
      firstname,
      fullName,
      email,
      tel,
      address,
      city,
      state,
      postcode,
      message,
      payment_method,
      items,
    };

    await createOrder({
      firstname,
      lastname,
      fullName,
      email,
      tel,
      address,
      city,
      state,
      postcode,
      message,
      payment_method,
      items,
    });

    await sendMailBatch(transporter, [
      {
        from: `"Commande" <${mailConfig.from}>`,
        to: mailConfig.to,
        subject: "Nouvelle commande (site web)",
        replyTo: email,
        attachments,
        html: renderOrderEmailHtml("admin", order),
      },
      {
        from: `"La Table Marine" <${mailConfig.from}>`,
        to: email,
        subject: "Confirmation de votre commande — La Table Marine",
        replyTo: mailConfig.to,
        attachments,
        html: renderOrderEmailHtml("customer", order),
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/checkout]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
