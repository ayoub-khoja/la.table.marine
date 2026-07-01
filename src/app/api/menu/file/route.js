import { NextResponse } from "next/server";

import { withMenuPdfViewOptions } from "@library/menu/pdf-url";
import { getActiveCarteMenu } from "@library/menu/store";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const menu = await getActiveCarteMenu();

    if (!menu?.fileUrl) {
      return NextResponse.json(
        { success: false, error: "La carte menu n'est pas encore disponible." },
        { status: 404 }
      );
    }

    const fileUrl = withMenuPdfViewOptions(menu.fileUrl, request.nextUrl.origin);

    return NextResponse.redirect(fileUrl, 302);
  } catch (error) {
    console.error("[api/menu/file]", error);
    return NextResponse.json(
      { success: false, error: "Impossible d'ouvrir la carte menu." },
      { status: 500 }
    );
  }
}
