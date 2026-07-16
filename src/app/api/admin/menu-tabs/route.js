import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { createMenuTab, listMenuTabs } from "@library/menu-tabs/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const tabs = await listMenuTabs();
    return NextResponse.json({ success: true, tabs });
  } catch (error) {
    console.error("[api/admin/menu-tabs]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les onglets." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const tab = await createMenuTab({
      label: body?.label,
      icon: body?.icon,
    });

    return NextResponse.json({ success: true, tab });
  } catch (error) {
    console.error("[api/admin/menu-tabs]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible d'ajouter l’onglet.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
