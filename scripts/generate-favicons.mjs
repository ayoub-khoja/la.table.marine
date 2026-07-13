import fs from "fs";
import path from "path";

import sharp from "sharp";

const source = "public/favicon.png";
const outDir = "public/icons";

fs.mkdirSync(outDir, { recursive: true });

const sizes = [48, 96, 192];

for (const size of sizes) {
  await sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `favicon-${size}x${size}.png`));
}

await sharp(source)
  .resize(192, 192, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile("src/app/icon.png");

await sharp(source)
  .resize(180, 180, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile("src/app/apple-icon.png");

await sharp(source)
  .resize(32, 32, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile("public/favicon-32x32.png");

console.log("Favicons generated.");
