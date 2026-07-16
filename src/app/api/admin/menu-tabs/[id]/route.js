import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { deleteTabItemsByTab } from "@library/menu-tabs/items-store";
import {
  deleteMenuTab,
  moveMenuTab,
  updateMenuTab,
} from "@library/menu-tabs/store";

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

    if (body?.direction === "left" || body?.direction === "right") {
      const tabs = await moveMenuTab(id, body.direction);
      return NextResponse.json({ success: true, tabs });
    }

    const tab = await updateMenuTab(id, {
      label: body?.label,
      icon: body?.icon,
    });

    return NextResponse.json({ success: true, tab });
  } catch (error) {
    console.error("[api/admin/menu-tabs/[id]]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible de mettre à jour l’onglet.";

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

    const result = await deleteMenuTab(id);

    if (!result.deleted) {
      const error =
        result.reason === "last"
          ? "Impossible de supprimer le dernier onglet."
          : "Onglet introuvable.";
      return NextResponse.json(
        { success: false, error },
        { status: result.reason === "last" ? 400 : 404 }
      );
    }

    if (result.tab?.kind === "custom") {
      await deleteTabItemsByTab(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/menu-tabs/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer l’onglet." },
      { status: 500 }
    );
  }
}
