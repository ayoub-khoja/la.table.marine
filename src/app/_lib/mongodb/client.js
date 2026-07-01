import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

function connectClient() {
  if (!uri) {
    return null;
  }

  const client = new MongoClient(uri);

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise || global._mongoUri !== uri) {
      global._mongoUri = uri;
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  return client.connect();
}

function clearDevCache() {
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise = null;
    global._mongoUri = null;
  }
}

let clientPromise = connectClient();

export async function getDb() {
  if (!uri) {
    throw new Error("MONGODB_URI manquant dans les variables d'environnement.");
  }

  if (!clientPromise) {
    clientPromise = connectClient();
  }

  try {
    const client = await clientPromise;
    return client.db();
  } catch (error) {
    clearDevCache();
    clientPromise = connectClient();

    if (error?.message?.includes("authentication failed")) {
      throw new Error(
        "MongoDB : authentification échouée. Vérifiez MONGODB_URI dans .env.local puis redémarrez le serveur (npm run dev). Test : node scripts/verify-mongodb.js"
      );
    }
    throw error;
  }
}

export function isMongoConfigured() {
  return Boolean(uri);
}

export default clientPromise;
