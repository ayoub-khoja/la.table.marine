import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { deleteProduct, moveProduct } from "@library/products/store";

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

    if (body?.direction === "up" || body?.direction === "down") {
      const products = await moveProduct(id, body.direction);
      return NextResponse.json({ success: true, products });
    }

    return NextResponse.json(
      { success: false, error: "Action non supportée." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/admin/products/[id]]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de mettre à jour l’article.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
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

    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Article introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/products/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer l’article." },
      { status: 500 }
    );
  }
}
