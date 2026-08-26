// Redimensionne l'image côté client avant envoi à la Server Action : réduit la
// charge sous la limite de body (10 Mo, cf. next.config.ts) et le coût en tokens
// vision, sans perte de précision perceptible pour la lecture d'une copie.

const MAX_DIMENSION = 1568;
const JPEG_QUALITY = 0.85;

export interface ProcessedImage {
  base64: string; // sans le préfixe data:...;base64,
  mediaType: "image/jpeg";
  dataUrl: string; // pour la prévisualisation <img src>
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible d'initialiser le contexte de rendu de l'image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1] ?? "";

  return { base64, mediaType: "image/jpeg", dataUrl };
}
