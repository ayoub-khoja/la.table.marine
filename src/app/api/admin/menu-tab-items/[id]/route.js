import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { deleteTabItem } from "@library/menu-tabs/items-store";

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

    const deleted = await deleteTabItem(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Article introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/menu-tab-items/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer l’article." },
      { status: 500 }
    );
  }
}
