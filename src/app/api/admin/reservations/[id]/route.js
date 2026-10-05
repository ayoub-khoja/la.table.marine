import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { deleteReservation } from "@library/reservations/store";

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

    const deleted = await deleteReservation(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Réservation introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/reservations/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer la réservation." },
      { status: 500 }
    );
  }
}
