import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { deleteReview, updateReview } from "@library/reviews/store";
import { REVIEW_STATUSES } from "@library/reviews/model";

export async function PATCH(request, { params }) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const id = params?.id?.toString().trim();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Identifiant manquant." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = {};

    if (body?.status !== undefined) {
      if (!Object.values(REVIEW_STATUSES).includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Statut invalide." },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body?.title !== undefined) updates.title = body.title;
    if (body?.text !== undefined) updates.text = body.text;
    if (body?.name !== undefined) updates.name = body.name;
    if (body?.rating !== undefined) updates.rating = body.rating;
    if (body?.email !== undefined) updates.email = body.email;

    const review = await updateReview(id, updates);

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Avis introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[api/admin/reviews/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de mettre à jour l'avis." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const id = params?.id?.toString().trim();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Identifiant manquant." },
        { status: 400 }
      );
    }

    const deleted = await deleteReview(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Avis introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/reviews/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer l'avis." },
      { status: 500 }
    );
  }
}
