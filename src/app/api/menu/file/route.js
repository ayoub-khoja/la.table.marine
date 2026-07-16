import { NextResponse } from "next/server";

import { withMenuPdfViewOptions } from "@library/menu/pdf-url";
import { openMenuPdfStream } from "@library/menu/pdf-storage";
import { getActiveCarteMenu } from "@library/menu/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = "no-store, max-age=0, must-revalidate";

export async function GET(request) {
  try {
    const menu = await getActiveCarteMenu();

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "La carte menu n'est pas encore disponible." },
        {
          status: 404,
          headers: { "Cache-Control": NO_STORE },
        }
      );
    }

    const download = request.nextUrl.searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    if (menu.gridFsId) {
      const { stream, file } = await openMenuPdfStream(menu.gridFsId);
      const fileName = menu.originalFileName || menu.fileName || file.filename || "carte-menu.pdf";

      return new NextResponse(stream, {
        headers: {
          "Content-Type": menu.mimeType || "application/pdf",
          "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileName)}"`,
          "Cache-Control": NO_STORE,
          ...(file.length ? { "Content-Length": String(file.length) } : {}),
        },
      });
    }

    if (!menu.fileUrl) {
      return NextResponse.json(
        { success: false, error: "La carte menu n'est pas encore disponible." },
        {
          status: 404,
          headers: { "Cache-Control": NO_STORE },
        }
      );
    }

    if (download) {
      const absolute = new URL(menu.fileUrl, request.nextUrl.origin);
      const upstream = await fetch(absolute, { cache: "no-store" });
      if (!upstream.ok) {
        return NextResponse.json(
          { success: false, error: "Impossible de télécharger la carte menu." },
          { status: 500, headers: { "Cache-Control": NO_STORE } }
        );
      }

      const fileName = menu.originalFileName || menu.fileName || "carte-menu.pdf";
      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": menu.mimeType || "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
          "Cache-Control": NO_STORE,
        },
      });
    }

    const fileUrl = withMenuPdfViewOptions(menu.fileUrl, request.nextUrl.origin, {
      updatedAt: menu.updatedAt,
      gridFsId: menu.gridFsId,
      version: menu.version,
    });

    const response = NextResponse.redirect(fileUrl, 302);
    response.headers.set("Cache-Control", NO_STORE);
    return response;
  } catch (error) {
    console.error("[api/menu/file]", error);
    return NextResponse.json(
      { success: false, error: "Impossible d'ouvrir la carte menu." },
      {
        status: 500,
        headers: { "Cache-Control": NO_STORE },
      }
    );
  }
}
