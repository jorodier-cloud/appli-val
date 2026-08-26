// Script ponctuel — génère les icônes PWA à partir d'un glyphe SVG.
// Exécution : node scripts/generate-icons.mjs
// Peut être supprimé après génération ; les PNG produits dans public/ sont la source de vérité.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const iconsDir = path.join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

const BRAND = "#4f46e5"; // indigo-600, cohérent avec l'UI

// Glyphe centré sur un canvas 100x100, réutilisé à toutes les résolutions.
function glyphSvg({ size, background, contentScale }) {
  const glyphSize = size * contentScale;
  const offset = (size - glyphSize) / 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${background}" />
  <g transform="translate(${offset}, ${offset})">
    <svg width="${glyphSize}" height="${glyphSize}" viewBox="0 0 100 100">
      <text x="50" y="68" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="700" fill="#ffffff">&#8721;</text>
    </svg>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, background: BRAND, contentScale: 0.72 },
  { file: "icon-512.png", size: 512, background: BRAND, contentScale: 0.72 },
  // Maskable : contenu dans la "safe zone" centrale (~80%) pour survivre au masquage OS.
  { file: "maskable-icon-512.png", size: 512, background: BRAND, contentScale: 0.6 },
];

for (const t of targets) {
  const svg = glyphSvg(t);
  await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, t.file));
  console.log(`✓ public/icons/${t.file}`);
}

// Apple touch icon : pas de transparence, coins arrondis appliqués par iOS lui-même.
const appleSvg = glyphSvg({ size: 180, background: BRAND, contentScale: 0.72 });
await sharp(Buffer.from(appleSvg))
  .flatten({ background: BRAND })
  .png()
  .toFile(path.join(root, "public", "apple-touch-icon.png"));
console.log("✓ public/apple-touch-icon.png");

// Favicon PNG (32x32) — évite la complexité du format .ico pour ce prototype.
const faviconSvg = glyphSvg({ size: 32, background: BRAND, contentScale: 0.75 });
await sharp(Buffer.from(faviconSvg)).png().toFile(path.join(root, "public", "favicon.png"));
console.log("✓ public/favicon.png");
