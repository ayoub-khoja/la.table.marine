import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import { openMenuPdfStream } from "@library/menu/pdf-storage";
import { getLatestCarteMenu } from "@library/menu/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Téléchargement / aperçu admin du dernier PDF (même s'il est désactivé).
 */
export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const menu = await getLatestCarteMenu();
    if (!menu) {
      return NextResponse.json(
        { success: false, error: "Aucun menu disponible." },
        { status: 404 }
      );
    }

    const download = request.nextUrl.searchParams.get("download") !== "0";
    const disposition = download ? "attachment" : "inline";
    const fileName =
      menu.originalFileName || menu.fileName || "carte-menu.pdf";

    if (menu.gridFsId) {
      const { stream, file } = await openMenuPdfStream(menu.gridFsId);
      return new NextResponse(stream, {
        headers: {
          "Content-Type": menu.mimeType || "application/pdf",
          "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileName)}"`,
          "Cache-Control": "no-store, max-age=0",
          ...(file.length ? { "Content-Length": String(file.length) } : {}),
        },
      });
    }

    if (!menu.fileUrl) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier associé au menu." },
        { status: 404 }
      );
    }

    const absolute = new URL(
      menu.fileUrl.split("?")[0],
      request.nextUrl.origin
    );
    const upstream = await fetch(absolute, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: "Impossible de lire le fichier menu." },
        { status: 500 }
      );
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": menu.mimeType || "application/pdf",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/admin/menu/file]", error);
    return NextResponse.json(
      { success: false, error: "Impossible d'ouvrir le menu." },
      { status: 500 }
    );
  }
}
