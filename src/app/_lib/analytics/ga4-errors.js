import { parseGoogleApiErrorMessage } from "./ga4-error-parse";

export class Ga4ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "Ga4ConfigError";
    this.code = "GA4_NOT_CONFIGURED";
  }
}

export class Ga4ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "Ga4ValidationError";
    this.code = "GA4_VALIDATION";
  }
}

export class Ga4ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode]
   */
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "Ga4ApiError";
    this.code = "GA4_API_ERROR";
    this.statusCode = statusCode;
  }
}

/**
 * @param {unknown} error
 * @returns {{ status: number, body: { success: false, error: string, code?: string } }}
 */
export function mapGa4ErrorResponse(error) {
  if (error instanceof Ga4ConfigError) {
    return {
      status: 503,
      body: {
        success: false,
        configured: false,
        error: error.message,
        code: error.code,
      },
    };
  }

  if (error instanceof Ga4ValidationError) {
    return {
      status: 400,
      body: { success: false, error: error.message, code: error.code },
    };
  }

  if (error instanceof Ga4ApiError) {
    return {
      status: error.statusCode,
      body: { success: false, error: error.message, code: error.code },
    };
  }

  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "Erreur lors de la récupération des données Google Analytics.";

  if (message.toLowerCase().includes("deadline") || message.toLowerCase().includes("timeout")) {
    return {
      status: 504,
      body: {
        success: false,
        error: "La requête Google Analytics a expiré. Réessayez dans quelques instants.",
        code: "GA4_TIMEOUT",
      },
    };
  }

  const parsed = parseGoogleApiErrorMessage(error);
  if (parsed) {
    console.error("[GA4]", error);
    return {
      status: 502,
      body: {
        success: false,
        error: parsed,
        code: "GA4_API_ERROR",
      },
    };
  }

  console.error("[GA4]", error);

  return {
    status: 502,
    body: {
      success: false,
      error:
        "Impossible de récupérer les données Google Analytics. Vérifiez les variables Vercel (GA4_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) et consultez docs/analytics-dashboard.md.",
      code: "GA4_UNKNOWN",
    },
  };
}
