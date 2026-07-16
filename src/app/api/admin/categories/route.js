import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { createCategory, listCategories } from "@library/categories/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listCategories(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/admin/categories]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les boissons." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const category = await createCategory({
      name: body?.name,
      slug: body?.slug,
      description: body?.description,
      image: body?.image,
      accompaniments: body?.accompaniments,
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("[api/admin/categories]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible d'ajouter la boisson.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
