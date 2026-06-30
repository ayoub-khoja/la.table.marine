const bcrypt = require("bcryptjs");
const password = process.argv[2] || "Test123*";

bcrypt.hash(password, 12).then((hash) => {
  const b64 = Buffer.from(hash, "utf8").toString("base64");
  console.log("Hash:", hash);
  console.log("\nDans .env.local :\n");
  console.log(`ADMIN_PASSWORD_HASH_B64=${b64}`);
});
