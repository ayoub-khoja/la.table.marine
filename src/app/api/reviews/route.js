import { NextResponse } from "next/server";
import { isMongoConfigured } from "@library/mongodb/client";
import { createReview, listPublishedReviews } from "@library/reviews/store";

const attempts = new Map();
const RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function GET(request) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Base de données non configurée (MONGODB_URI).",
      },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = await listPublishedReviews(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/reviews]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les avis." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Base de données non configurée (MONGODB_URI).",
      },
      { status: 503 }
    );
  }

  try {
    const rate = checkRateLimit(request);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const name = (body?.name || "").toString().trim();
    const email = (body?.email || "").toString().trim();
    const title = (body?.title || "").toString().trim();
    const text = (body?.text || "").toString().trim();
    const rating = Number(body?.rating);

    if (!name || !title || !text) {
      return NextResponse.json(
        {
          success: false,
          error: "Merci de remplir tous les champs obligatoires.",
        },
        { status: 400 }
      );
    }

    if (text.length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Votre avis doit contenir au moins 20 caractères.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Veuillez sélectionner une note entre 1 et 5." },
        { status: 400 }
      );
    }

    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Adresse e-mail invalide." },
        { status: 400 }
      );
    }

    const review = await createReview({ name, email, title, text, rating });

    return NextResponse.json({
      success: true,
      review,
      message:
        "Merci pour votre avis ! Il sera publié après validation par notre équipe.",
    });
  } catch (error) {
    console.error("[api/reviews]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
