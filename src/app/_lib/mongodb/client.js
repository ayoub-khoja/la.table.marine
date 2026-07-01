import { MongoClient } from "mongodb";

function normalizeMongoUri(raw) {
  if (!raw) return null;
  return raw.trim().replace(/^["']|["']$/g, "");
}

const uri = normalizeMongoUri(process.env.MONGODB_URI);

const clientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

function createClientPromise() {
  if (!uri) return null;
  return new MongoClient(uri, clientOptions).connect();
}

function getCachedClientPromise() {
  if (!uri) return null;

  if (!global._mongoClientPromise || global._mongoUri !== uri) {
    global._mongoUri = uri;
    global._mongoClientPromise = createClientPromise();
  }

  return global._mongoClientPromise;
}

function resetClientCache() {
  global._mongoClientPromise = null;
  global._mongoUri = null;
}

let clientPromise = getCachedClientPromise();

export async function getDb() {
  if (!uri) {
    throw new Error("MONGODB_URI manquant dans les variables d'environnement.");
  }

  if (!clientPromise) {
    clientPromise = getCachedClientPromise();
  }

  try {
    const client = await clientPromise;
    return client.db();
  } catch (error) {
    resetClientCache();
    clientPromise = getCachedClientPromise();

    try {
      const client = await clientPromise;
      return client.db();
    } catch (retryError) {
      resetClientCache();
      clientPromise = null;

      if (retryError?.message?.includes("authentication failed")) {
        throw new Error(
          "MongoDB : authentification échouée. Vérifiez MONGODB_URI (utilisateur, mot de passe encodé, base restaurant_prod)."
        );
      }

      if (
        retryError?.message?.includes("SSL") ||
        retryError?.message?.includes("TLS") ||
        retryError?.name === "MongoServerSelectionError"
      ) {
        throw new Error(
          "MongoDB : connexion impossible. Vérifiez MONGODB_URI sur Vercel et Network Access Atlas (0.0.0.0/0)."
        );
      }

      throw retryError;
    }
  }
}

export function isMongoConfigured() {
  return Boolean(uri);
}

export default clientPromise;
