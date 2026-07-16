import { NextResponse } from "next/server";

import { requireAdminSession } from "@library/admin/require-session";
import {
  getLatestCarteMenu,
  replaceCarteMenuPdf,
  setCarteMenuActive,
} from "@library/menu/store";
import { getPermanentMenuUrl } from "@library/menu/public-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ERROR_STATUS = {
  INVALID_FILE: 400,
  EMPTY_FILE: 400,
  INVALID_TYPE: 415,
  FILE_TOO_LARGE: 413,
};

const ERROR_MESSAGES = {
  INVALID_FILE: "Fichier invalide.",
  EMPTY_FILE: "Le fichier PDF est vide.",
  INVALID_TYPE: "Format non supporté. Utilisez un fichier PDF valide.",
  FILE_TOO_LARGE: "Fichier trop volumineux (max. 15 Mo).",
};

function menuResponsePayload(menu) {
  return {
    success: true,
    menu,
    permanentUrl: getPermanentMenuUrl(),
    publicPath: "/menu",
  };
}

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const menu = await getLatestCarteMenu();
    return NextResponse.json(menuResponsePayload(menu));
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

    const previous = await getLatestCarteMenu();
    const { menu, created } = await replaceCarteMenuPdf(file, {
      title: title || "Carte Menu",
      uploadedBy: auth.session?.email || null,
    });

    return NextResponse.json(
      {
        ...menuResponsePayload(menu),
        replaced: Boolean(previous),
      },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = ERROR_STATUS[code] || 500;
    const message =
      ERROR_MESSAGES[code] || "Impossible d'enregistrer le menu PDF.";

    console.error("[api/admin/menu]", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: status === 500 ? 500 : status }
    );
  }
}

export async function PATCH(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Indiquez active: true ou false." },
        { status: 400 }
      );
    }

    const menu = await setCarteMenuActive(body.active);
    if (!menu) {
      return NextResponse.json(
        { success: false, error: "Aucun menu à publier ou désactiver." },
        { status: 404 }
      );
    }

    return NextResponse.json(menuResponsePayload(menu));
  } catch (error) {
    console.error("[api/admin/menu]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de mettre à jour le statut du menu." },
      { status: 500 }
    );
  }
}
