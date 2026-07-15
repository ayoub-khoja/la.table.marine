import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { deleteSpecialMenu, updateSpecialMenu } from "@library/special-menus/store";

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
    const menu = await updateSpecialMenu(id, {
      name: body?.name,
      price: body?.price,
      image: body?.image,
      subtitle: body?.subtitle,
      courses: body?.courses,
      accompaniments: body?.accompaniments,
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "Menu introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, menu });
  } catch (error) {
    console.error("[api/admin/special-menus/[id]]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de modifier le menu.";

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

    const deleted = await deleteSpecialMenu(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Menu introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/special-menus/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer le menu." },
      { status: 500 }
    );
  }
}
