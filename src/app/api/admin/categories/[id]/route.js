import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import {
  deleteCategory,
  getCategoryProductCount,
  updateCategory,
} from "@library/categories/store";

export async function GET(request, { params }) {
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

    const productCount = await getCategoryProductCount(id);

    return NextResponse.json({ success: true, productCount });
  } catch (error) {
    console.error("[api/admin/categories/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger la boisson." },
      { status: 500 }
    );
  }
}

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

    if (body?.name !== undefined) updates.name = body.name;
    if (body?.slug !== undefined) updates.slug = body.slug;
    if (body?.description !== undefined) updates.description = body.description;

    const category = await updateCategory(id, updates);

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Boisson introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("[api/admin/categories/[id]]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de mettre à jour la boisson.";

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

    const result = await deleteCategory(id);

    if (!result.deleted) {
      return NextResponse.json(
        { success: false, error: "Boisson introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedProducts: result.deletedProducts,
    });
  } catch (error) {
    console.error("[api/admin/categories/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer la boisson." },
      { status: 500 }
    );
  }
}
