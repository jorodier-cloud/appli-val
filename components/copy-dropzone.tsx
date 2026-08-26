"use client";

import { ChangeEvent, DragEvent, useCallback, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { processImageFile, type ProcessedImage } from "@/lib/image";

interface CopyDropzoneProps {
  image: ProcessedImage | null;
  onImageChange: (image: ProcessedImage | null) => void;
  disabled?: boolean;
}

export function CopyDropzone({
  image,
  onImageChange,
  disabled,
}: CopyDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Format non supporté. Utilisez une image JPEG ou PNG.");
        return;
      }
      setError(null);
      try {
        const processed = await processImageFile(file);
        onImageChange(processed);
      } catch {
        setError("Impossible de traiter cette image.");
      }
    },
    [onImageChange]
  );

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFile(event.dataTransfer.files[0]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  if (image) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">
          Copie de l&apos;élève
        </span>
        <div className="relative overflow-hidden rounded-lg border border-line bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.dataUrl}
            alt="Prévisualisation de la copie"
            className="max-h-80 w-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => onImageChange(null)}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-ink-soft shadow hover:bg-white"
              aria-label="Retirer l'image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">
        Copie de l&apos;élève
      </span>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-white p-8 text-center transition-colors",
          isDragging && "border-terracotta-deep bg-terracotta/10",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <ImagePlus className="h-8 w-8 text-ink-soft" />
        <span className="text-sm text-ink-soft">
          Glissez-déposez une image, ou cliquez pour parcourir
        </span>
        <span className="text-xs text-ink-soft">JPEG ou PNG</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          disabled={disabled}
          onChange={handleInputChange}
        />
      </label>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
