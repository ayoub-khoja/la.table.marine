import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import {
  createReviewAdmin,
  listReviewsAdmin,
} from "@library/reviews/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listReviewsAdmin(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/admin/reviews]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les avis." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const name = (body?.name || "").toString().trim();
    const title = (body?.title || "").toString().trim();
    const text = (body?.text || "").toString().trim();
    const rating = Number(body?.rating);

    if (!name || !title || !text) {
      return NextResponse.json(
        {
          success: false,
          error: "Le nom, le titre et le texte sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "La note doit être comprise entre 1 et 5." },
        { status: 400 }
      );
    }

    const review = await createReviewAdmin({
      name,
      title,
      text,
      rating,
      email: (body?.email || "").toString().trim(),
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[api/admin/reviews]", error);
    return NextResponse.json(
      { success: false, error: "Impossible d'ajouter l'avis." },
      { status: 500 }
    );
  }
}
