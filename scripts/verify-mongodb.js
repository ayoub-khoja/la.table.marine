/**
 * Vérifie la connexion MongoDB depuis .env.local
 * Usage: node scripts/verify-mongodb.js
 */
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Fichier .env.local introuvable.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
let uri = null;

for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("MONGODB_URI=")) {
    uri = trimmed.slice("MONGODB_URI=".length).trim();
    break;
  }
}

if (!uri) {
  console.error("MONGODB_URI introuvable dans .env.local");
  process.exit(1);
}

const masked = uri.replace(/:([^@]+)@/, ":****@");
console.log("Test de connexion :", masked);

const client = new MongoClient(uri);

client
  .connect()
  .then(async () => {
    const db = client.db();
    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    let reviewsInfo = "collection absente";
    if (collectionNames.includes("reviews")) {
      const total = await db.collection("reviews").countDocuments();
      const approved = await db.collection("reviews").countDocuments({
        status: "approved",
      });
      const pending = await db.collection("reviews").countDocuments({
        status: "pending",
      });
      reviewsInfo = `${total} avis (${approved} publiés, ${pending} en attente)`;
    }

    console.log("Connexion réussie.");
    console.log("Base :", dbName);
    console.log(
      "Collections :",
      collectionNames.length ? collectionNames.join(", ") : "(aucune pour le moment)"
    );
    console.log("Reviews :", reviewsInfo);
    await client.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Échec de connexion :", error.message);

    if (error.message.includes("authentication failed")) {
      console.error(`
Causes fréquentes :
1. Mot de passe incorrect dans MongoDB Atlas (Database Access)
2. Nom d'utilisateur incorrect
3. Caractères spéciaux non encodés dans l'URI :
   & → %26   @ → %40   # → %23   / → %2F
4. Réinitialisez le mot de passe dans Atlas, puis mettez à jour .env.local

Exemple :
MONGODB_URI=mongodb+srv://USER:MotDePasseEncode@cluster0.dtogii3.mongodb.net/restaurant_locale?retryWrites=true&w=majority
`);
    }

    try {
      await client.close();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
