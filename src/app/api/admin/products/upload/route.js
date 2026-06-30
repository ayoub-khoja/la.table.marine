import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { saveUploadedImage } from "@library/uploads/save-file";

const ERROR_MESSAGES = {
  INVALID_FILE: "Fichier invalide.",
  INVALID_TYPE: "Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.",
  FILE_TOO_LARGE: "Image trop volumineuse (max. 5 Mo).",
};

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    const saved = await saveUploadedImage(file);

    return NextResponse.json({
      success: true,
      ...saved,
    });
  } catch (error) {
    const code = error?.message;
    const message =
      ERROR_MESSAGES[code] || "Impossible d'enregistrer l'image.";

    console.error("[api/admin/products/upload]", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: code === "FILE_TOO_LARGE" ? 413 : 400 }
    );
  }
}
