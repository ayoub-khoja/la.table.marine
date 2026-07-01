import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { createActiveCarteMenu, getActiveCarteMenu } from "@library/menu/store";
import { saveUploadedMenuPdf } from "@library/uploads/save-file";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES = {
  INVALID_FILE: "Fichier invalide.",
  INVALID_TYPE: "Format non supporté. Utilisez un fichier PDF.",
  FILE_TOO_LARGE: "Fichier trop volumineux (max. 15 Mo).",
};

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const menu = await getActiveCarteMenu();

    return NextResponse.json({
      success: true,
      menu,
    });
  } catch (error) {
    console.error("[api/admin/menu]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger le menu." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("pdf");
    const title = (formData.get("title") || "Carte Menu").toString().trim();

    const saved = await saveUploadedMenuPdf(file);
    const menu = await createActiveCarteMenu({
      title: title || "Carte Menu",
      fileName: saved.fileName,
      fileUrl: saved.fileUrl,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
    });

    return NextResponse.json({
      success: true,
      menu,
    });
  } catch (error) {
    const code = error?.message;
    const message =
      ERROR_MESSAGES[code] || "Impossible d'enregistrer le menu PDF.";

    console.error("[api/admin/menu]", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: code === "FILE_TOO_LARGE" ? 413 : 400 }
    );
  }
}
