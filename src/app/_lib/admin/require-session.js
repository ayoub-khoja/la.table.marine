import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@library/admin/session";

/**
 * Vérifie la session admin pour les routes API.
 * @returns {Promise<{ session: object } | { response: NextResponse }>}
 */
export async function requireAdminSession(request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      response: NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      ),
    };
  }

  return { session };
}
