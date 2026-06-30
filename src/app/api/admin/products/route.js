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
      { success: false, error: "Impossible de charger les produits." },
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
    const currency = (body?.currency || "$").toString().trim();
    const short = (body?.short || "").toString().trim();

    if (!title || !price) {
      return NextResponse.json(
        { success: false, error: "Le titre et le prix sont obligatoires." },
        { status: 400 }
      );
    }

    const product = await createProduct({
      title,
      price,
      image,
      old_price,
      currency,
      short,
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("[api/admin/products]", error);
    return NextResponse.json(
      { success: false, error: "Impossible d'ajouter le produit." },
      { status: 500 }
    );
  }
}
