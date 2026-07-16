import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { createTabItem, listTabItems } from "@library/menu-tabs/items-store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const tabId = searchParams.get("tabId")?.toString().trim();

    if (!tabId) {
      return NextResponse.json(
        { success: false, error: "tabId manquant." },
        { status: 400 }
      );
    }

    const result = await listTabItems(tabId, searchParams);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[api/admin/menu-tab-items]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les articles." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const item = await createTabItem({
      tabId: body?.tabId,
      title: body?.title,
      price: body?.price,
      short: body?.short,
      section: body?.section,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("[api/admin/menu-tab-items]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible d'ajouter l’article.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
