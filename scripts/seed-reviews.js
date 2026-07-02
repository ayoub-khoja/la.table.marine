/**
 * Initialise la collection reviews (indexes + avis de départ).
 * Usage local :  npm run db:seed-reviews
 * Usage prod   : définir MONGODB_URI vers restaurant_prod puis lancer le script
 */
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { MongoClient } = require("mongodb");

const REVIEWS_COLLECTION = "reviews";
const STATIC_REVIEWS_FILE = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "sliders",
  "testimonial.json"
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function formatReviewDate(iso) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
      .format(new Date(iso))
      .replace(/\//g, ".");
  } catch {
    return "";
  }
}

function loadStaticSeed() {
  const raw = fs.readFileSync(STATIC_REVIEWS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const now = new Date().toISOString();

  return items.map((item) => {
    const text = (item.text || "").toString();
    return {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      title: (item.title || "").toString(),
      text,
      name: (item.name || "").toString(),
      email: "",
      rating: Number(item.rating) || 5,
      date: (item.date || formatReviewDate(now)).toString(),
      status: "approved",
      source: "seed",
      preview: text.length > 120 ? `${text.slice(0, 120)}…` : text,
    };
  });
}

async function ensureReviewsIndexes(collection) {
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ status: 1, createdAt: -1 });
  await collection.createIndex({ createdAt: -1 });
}

loadEnvFile(path.join(__dirname, "..", ".env.local"));
loadEnvFile(path.join(__dirname, "..", ".env"));

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI manquant. Ajoutez-le dans .env.local ou .env");
  process.exit(1);
}

const masked = uri.replace(/:([^@]+)@/, ":****@");
console.log("Connexion :", masked);

const client = new MongoClient(uri);

client
  .connect()
  .then(async () => {
    const db = client.db();
    const collection = db.collection(REVIEWS_COLLECTION);

    await ensureReviewsIndexes(collection);

    const count = await collection.countDocuments();
    let inserted = 0;

    if (count === 0) {
      const seed = loadStaticSeed();
      if (seed.length) {
        await collection.insertMany(seed);
        inserted = seed.length;
      }
    }

    const total = await collection.countDocuments();
    const approved = await collection.countDocuments({ status: "approved" });
    const pending = await collection.countDocuments({ status: "pending" });

    console.log("Connexion réussie.");
    console.log("Base :", db.databaseName);
    console.log("Collection :", REVIEWS_COLLECTION);
    console.log("Avis insérés :", inserted);
    console.log("Total avis :", total);
    console.log("Publiés :", approved);
    console.log("En attente :", pending);
    console.log("Terminé.");

    await client.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Échec :", error.message);
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
