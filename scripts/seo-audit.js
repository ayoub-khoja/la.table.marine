/**
 * Audit SEO interne — détecte les incohérences de configuration.
 * Usage : npm run seo:audit
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const seoDir = path.join(root, "src/app/_lib/seo");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractPageSeoKeys() {
  const content = read(path.join(seoDir, "page-metadata.js"));
  const keys = [...content.matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]);
  return keys;
}

function extractTitlesAndDescriptions() {
  const content = read(path.join(seoDir, "page-metadata.js"));
  const entries = [...content.matchAll(
    /\w+:\s*\{\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)"/gs
  )];
  return entries.map((m) => ({ title: m[1], description: m[2] }));
}

function main() {
  const errors = [];
  const warnings = [];

  const entries = extractTitlesAndDescriptions();
  const titles = entries.map((e) => e.title);
  const descriptions = entries.map((e) => e.description);

  const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  const duplicateDescriptions = descriptions.filter((d, i) => descriptions.indexOf(d) !== i);

  if (duplicateTitles.length) {
    errors.push(`Titles en doublon : ${[...new Set(duplicateTitles)].join(", ")}`);
  }

  if (duplicateDescriptions.length) {
    warnings.push(
      `Descriptions en doublon : ${[...new Set(duplicateDescriptions)].join(", ")}`
    );
  }

  const requiredFiles = [
    "src/app/robots.js",
    "src/app/sitemap.js",
    "src/app/_lib/seo/config.js",
    "src/app/_lib/seo/metadata.js",
    "src/app/_lib/seo/json-ld.js",
    "src/app/_lib/seo/routes.js",
    "src/app/_lib/seo/page-metadata.js",
    "docs/seo.md",
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(root, file))) {
      errors.push(`Fichier SEO manquant : ${file}`);
    }
  }

  const routes = read(path.join(seoDir, "routes.js"));
  if (!routes.includes("/admin")) {
    errors.push("robots/routes : /admin doit être exclu");
  }
  if (!routes.includes("/api")) {
    errors.push("robots/routes : /api doit être exclu");
  }

  const jsonLd = read(path.join(seoDir, "json-ld.js"));
  if (jsonLd.includes("aggregateRating")) {
    errors.push("JSON-LD : aggregateRating interdit sans données réelles");
  }

  const config = read(path.join(seoDir, "config.js"));
  if (!config.includes("latablemarine.com")) {
    errors.push("Configuration : siteUrl canonique manquant");
  }
  if (config.includes("socialProfiles: []")) {
    warnings.push("TODO : ajouter les URLs sociales réelles dans SEO_CONFIG.socialProfiles");
  }

  console.log("\n=== Audit SEO La Table Marine ===\n");

  if (!errors.length && !warnings.length) {
    console.log("✅ Aucun problème détecté dans la configuration centrale.");
  }

  if (warnings.length) {
    console.log("⚠️  Avertissements :");
    warnings.forEach((w) => console.log(" -", w));
  }

  if (errors.length) {
    console.log("❌ Erreurs :");
    errors.forEach((e) => console.log(" -", e));
    process.exit(1);
  }

  console.log(`\nPages SEO configurées : ${extractPageSeoKeys().length}`);
  console.log("Pensez aussi à vérifier manuellement : /robots.txt, /sitemap.xml, Rich Results Test.\n");
}

main();
