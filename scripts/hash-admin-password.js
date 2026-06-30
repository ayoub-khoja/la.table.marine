/**
 * Usage: node scripts/hash-admin-password.js "VotreMotDePasse"
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-admin-password.js "MotDePasse"');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  const b64 = Buffer.from(hash, "utf8").toString("base64");
  console.log("\nAjoutez dans .env.local :\n");
  console.log(`ADMIN_PASSWORD_HASH_B64=${b64}\n`);
  console.log("(Format base64 — compatible Next.js, sans problème de caractères $)\n");
});
