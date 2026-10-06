"use client";

import { useState } from "react";

const BIN_WIDTH = 2;
const PLOT_HEIGHT = 56;

interface Bin {
  from: number;
  to: number;
  count: number;
}

/** Tranches de 2 points sur [0, 20] ; 20 tombe dans la dernière tranche. */
function binNotes(notes: number[], maxScore: number): Bin[] {
  const binCount = Math.ceil(maxScore / BIN_WIDTH);
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    from: i * BIN_WIDTH,
    to: Math.min((i + 1) * BIN_WIDTH, maxScore),
    count: 0,
  }));
  for (const note of notes) {
    const index = Math.min(Math.floor(note / BIN_WIDTH), binCount - 1);
    if (index >= 0) bins[index]!.count += 1;
  }
  return bins;
}

function copies(count: number): string {
  return `${count} copie${count > 1 ? "s" : ""}`;
}

/**
 * Répartition des notes d'une évaluation : un histogramme à une seule série
 * (terracotta, validé contraste/chroma sur le fond carte), lecture au survol
 * ou au clavier, et tableau équivalent pour les lecteurs d'écran.
 */
export function NotesHistogram({ notes, maxScore }: { notes: number[]; maxScore: number }) {
  const [active, setActive] = useState<number | null>(null);
  if (notes.length < 2) return null;

  const bins = binNotes(notes, maxScore);
  const maxCount = Math.max(...bins.map((b) => b.count));
  const activeBin = active !== null ? bins[active] : null;

  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="text-[12.5px] font-medium text-ink-soft">Répartition des notes</figcaption>
      <div
        className="flex items-end gap-[2px] border-b border-line"
        style={{ height: PLOT_HEIGHT }}
        role="img"
        aria-label={`Histogramme de ${copies(notes.length)}, détail dans le tableau qui suit`}
        tabIndex={0}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((current) => current ?? 0)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          const step = e.key === "ArrowRight" ? 1 : -1;
          setActive((current) => Math.min(Math.max((current ?? 0) + step, 0), bins.length - 1));
        }}
      >
        {bins.map((bin, i) => (
          <div
            key={bin.from}
            onPointerEnter={() => setActive(i)}
            className="flex h-full flex-1 items-end"
          >
            {bin.count > 0 && (
              <div
                className={`w-full rounded-t-[4px] bg-terracotta transition-opacity ${
                  active !== null && active !== i ? "opacity-45" : ""
                }`}
                style={{ height: `${(bin.count / maxCount) * 100}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="relative h-3.5 text-[11px] text-ink-soft" aria-hidden="true">
        <span className="absolute left-0">0</span>
        <span className="absolute left-1/2 -translate-x-1/2">{maxScore / 2}</span>
        <span className="absolute right-0">{maxScore}</span>
      </div>
      <p className="h-4 text-[12.5px] text-ink" aria-live="polite">
        {activeBin && (
          <>
            <b className="font-semibold">{copies(activeBin.count)}</b>
            <span className="text-ink-soft">
              {" "}
              entre {activeBin.from} et {activeBin.to}
            </span>
          </>
        )}
      </p>
      <table className="sr-only">
        <caption>Nombre de copies par tranche de notes</caption>
        <thead>
          <tr>
            <th scope="col">Tranche</th>
            <th scope="col">Copies</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((bin) => (
            <tr key={bin.from}>
              <td>
                {bin.from} à {bin.to}
              </td>
              <td>{bin.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
