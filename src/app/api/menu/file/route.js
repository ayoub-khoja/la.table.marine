import { NextResponse } from "next/server";

import { withMenuPdfViewOptions } from "@library/menu/pdf-url";
import { openMenuPdfStream } from "@library/menu/pdf-storage";
import { getActiveCarteMenu } from "@library/menu/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const menu = await getActiveCarteMenu();

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "La carte menu n'est pas encore disponible." },
        { status: 404 }
      );
    }

    if (menu.gridFsId) {
      const { stream, file } = await openMenuPdfStream(menu.gridFsId);
      const fileName = menu.fileName || file.filename || "carte-menu.pdf";

      return new NextResponse(stream, {
        headers: {
          "Content-Type": menu.mimeType || "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
          "Cache-Control": "public, max-age=3600",
          ...(file.length ? { "Content-Length": String(file.length) } : {}),
        },
      });
    }

    if (!menu.fileUrl) {
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
