import { NextResponse } from "next/server";
import { requireAdminSession } from "@library/admin/require-session";
import { createProduct, listProducts } from "@library/products/store";

export async function GET(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listProducts(searchParams);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[api/admin/products]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger notre carte." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    const title = (body?.title || "").toString().trim();
    const price = (body?.price || "").toString().trim();
    const image = (body?.image || "").toString().trim();
    const old_price = (body?.old_price || "").toString().trim();
    const short = (body?.short || "").toString().trim();
    const categoryId = (body?.categoryId || "").toString().trim();

    if (!title || !price) {
      return NextResponse.json(
        { success: false, error: "Le titre et le prix sont obligatoires." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "La catégorie est obligatoire." },
        { status: 400 }
      );
    }

    const product = await createProduct({
      title,
      price,
      image,
      old_price,
      short,
      categoryId,
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("[api/admin/products]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Impossible d'ajouter à notre carte.";

    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
