"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent } from "react";
import { Download, GripVertical, Plus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNiveaux,
  useProgression,
  createNiveau,
  deleteNiveau,
  setProgressionForNiveau,
  updateProgressionItem,
  removeProgressionItem,
  moveProgressionItem,
  reorderProgression,
} from "@/lib/store";
import { downloadTextFile } from "@/lib/markdown";
import type { ProgressionItem } from "@/types/pedagogie";

function parseChaptersText(text: string): { titre: string; periode: string }[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const clean = line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim();
      const parts = clean.split(/\s+[—–-]\s+/);
      const titre = parts[0]!.trim();
      const periode = parts.length > 1 ? parts.slice(1).join(" - ").trim() : "";
      return { titre, periode };
    })
    .filter((c) => c.titre.length > 0);
}

function chaptersToText(items: ProgressionItem[]): string {
  return items.map((c) => (c.periode ? `${c.titre} — ${c.periode}` : c.titre)).join("\n");
}

async function readImportFile(file: File): Promise<string> {
  let text: string;
  if (file.name.toLowerCase().endsWith(".docx")) {
    const mammoth = (await import("mammoth")).default;
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    text = result.value;
  } else {
    text = await file.text();
  }
  if (file.name.toLowerCase().endsWith(".csv")) {
    text = text
      .split("\n")
      .map((line) => line.split(/[;,]/).filter(Boolean).join(" — "))
      .join("\n");
  }
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s && !/^#/.test(s))
    .join("\n");
}

function Dropzone({ onImported }: { onImported: (text: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    try {
      onImported(await readImportFile(file));
      setError(null);
    } catch {
      setError("Lecture du fichier impossible.");
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  };

  return (
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed border-terracotta px-5 py-6 text-center transition-colors ${
          isOver ? "bg-[#F4E5CE]" : "bg-[#F8EEDD] hover:bg-[#F4E5CE]"
        }`}
      >
        <UploadCloud className="mx-auto mb-2 h-8 w-8 text-terracotta" />
        <strong className="mb-0.5 block text-[14.5px] text-ink">Importer une progression</strong>
        <span className="text-[12.5px] text-ink-soft">
          Glissez un fichier .docx, .md, .txt ou .csv — ou cliquez pour le choisir
        </span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.md,.txt,.csv"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="mt-2 text-xs text-terracotta-deep">{error}</p>}
    </div>
  );
}

interface ChapterRowProps {
  item: ProgressionItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  niveauId: string;
  onPointerDownHandle: (e: ReactPointerEvent<HTMLSpanElement>) => void;
}

function ChapterRow({
  item,
  index,
  isFirst,
  isLast,
  isDragging,
  niveauId,
  onPointerDownHandle,
}: ChapterRowProps) {
  const handleDelete = () => {
    if (!confirm(`Supprimer « ${item.titre} » ?`)) return;
    removeProgressionItem(item.id);
  };

  return (
    <div
      data-chap-id={item.id}
      className={`mb-2 flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2.5 transition-shadow ${
        isDragging
          ? "relative z-[5] scale-[1.015] border-terracotta bg-white shadow-[0_12px_26px_-8px_rgba(44,33,22,0.4)]"
          : "border-line"
      } ${item.traite ? "opacity-80" : ""}`}
    >
      <span
        onPointerDown={onPointerDownHandle}
        className="shrink-0 cursor-grab touch-none select-none text-ink-soft active:cursor-grabbing"
        title="Glisser pour réordonner (appui long)"
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <input
        type="checkbox"
        checked={item.traite}
        onChange={(e) => updateProgressionItem(item.id, { traite: e.target.checked })}
        className="h-[17px] w-[17px] shrink-0 accent-sauge"
      />
      <input
        value={item.titre}
        onChange={(e) => updateProgressionItem(item.id, { titre: e.target.value })}
        className={`min-w-0 flex-1 rounded-md border-none bg-transparent px-1 py-1 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-terracotta ${
          item.traite ? "text-ink-soft line-through" : "text-ink"
        }`}
      />
      <input
        value={item.periode}
        placeholder="période"
        onChange={(e) => updateProgressionItem(item.id, { periode: e.target.value })}
        className="w-28 shrink-0 rounded-lg bg-[#EFE2C8] px-2 py-1 text-[11.5px] text-ink-soft outline-none placeholder:italic placeholder:text-[#A8987F] focus:bg-white focus:ring-2 focus:ring-terracotta"
      />
      <div className="flex shrink-0 flex-col gap-0.5">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => moveProgressionItem(niveauId, item.id, -1)}
          className="rounded px-1 text-[10px] leading-none text-ink-soft hover:bg-[#EFE2C8] hover:text-ink disabled:opacity-25"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => moveProgressionItem(niveauId, item.id, 1)}
          className="rounded px-1 text-[10px] leading-none text-ink-soft hover:bg-[#EFE2C8] hover:text-ink disabled:opacity-25"
        >
          ▼
        </button>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Supprimer ${item.titre}`}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-lg leading-none text-[#a9705c] hover:bg-[#EDD6CB] hover:text-[#7A3D2C]"
      >
        ×
      </button>
      <span className="sr-only">Séance {index + 1}</span>
    </div>
  );
}

function ChapterList({ niveauId, items }: { niveauId: string; items: ProgressionItem[] }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const baseOrder = items.map((c) => c.id);
  const displayOrder = dragOrder ?? baseOrder;
  const byId = new Map(items.map((c) => [c.id, c]));

  const handlePointerDown = (e: ReactPointerEvent<HTMLSpanElement>, id: string) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    cancelPress();
    pressTimer.current = setTimeout(() => {
      setDragId(id);
      setDragOrder(baseOrder);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
    }, 420);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragId) {
      if (
        pressTimer.current &&
        (Math.abs(e.clientY - startPos.current.y) > 9 || Math.abs(e.clientX - startPos.current.x) > 9)
      ) {
        cancelPress();
      }
      return;
    }
    const under = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-chap-id]") as HTMLElement | null;
    if (!under) return;
    const underId = under.dataset.chapId!;
    if (underId === dragId) return;
    setDragOrder((current) => {
      const order = current ? [...current] : baseOrder;
      const from = order.indexOf(dragId);
      const to = order.indexOf(underId);
      if (from === -1 || to === -1) return order;
      order.splice(from, 1);
      order.splice(to, 0, dragId);
      return order;
    });
  };

  const endDrag = () => {
    cancelPress();
    if (dragId && dragOrder) reorderProgression(niveauId, dragOrder);
    setDragId(null);
    setDragOrder(null);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/40 px-5 py-8 text-center text-[13.5px] text-ink-soft">
        Aucun chapitre. Importez un fichier ou saisissez-les ci-dessus.
      </div>
    );
  }

  return (
    <div onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      {displayOrder.map((id, index) => {
        const item = byId.get(id);
        if (!item) return null;
        return (
          <ChapterRow
            key={id}
            item={item}
            index={index}
            isFirst={index === 0}
            isLast={index === displayOrder.length - 1}
            isDragging={dragId === id}
            niveauId={niveauId}
            onPointerDownHandle={(e) => handlePointerDown(e, id)}
          />
        );
      })}
    </div>
  );
}

export function ProgressionsManager() {
  const niveaux = useNiveaux();
  const [niveauId, setNiveauId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!niveauId && niveaux.length > 0) setNiveauId(niveaux[0]!.id);
    if (niveauId && !niveaux.some((n) => n.id === niveauId)) setNiveauId(niveaux[0]?.id ?? null);
  }, [niveaux, niveauId]);

  const progression = useProgression(niveauId);
  const niveau = niveaux.find((n) => n.id === niveauId) ?? null;

  const handleAddNiveau = () => {
    const nom = prompt("Nom du niveau (ex. 4ème, Première spécialité)");
    if (!nom || !nom.trim()) return;
    const created = createNiveau(nom);
    setNiveauId(created.id);
  };

  const handleDeleteNiveau = () => {
    if (!niveau) return;
    if (!confirm(`Supprimer le niveau ${niveau.nom} et sa progression ?`)) return;
    deleteNiveau(niveau.id);
  };

  const handleSaveChapters = () => {
    if (!niveauId || !textareaRef.current) return;
    const drafts = parseChaptersText(textareaRef.current.value);
    setProgressionForNiveau(niveauId, drafts);
    textareaRef.current.value = drafts
      .map((d) => (d.periode ? `${d.titre} — ${d.periode}` : d.titre))
      .join("\n");
  };

  const handleExport = () => {
    if (!niveau) return;
    const text =
      `# Progression — ${niveau.nom}\n\n` +
      progression
        .map((c, i) => `${i + 1}. ${c.titre}${c.periode ? " — " + c.periode : ""}${c.traite ? "  [traité]" : ""}`)
        .join("\n");
    downloadTextFile(text, `progression-${niveau.nom.replace(/\s+/g, "-")}.md`, "text/markdown");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[17px] font-semibold text-ink">Progressions par niveau</h2>
        <Button onClick={handleAddNiveau}>
          <Plus className="h-4 w-4" />
          Ajouter un niveau
        </Button>
      </div>

      {niveaux.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Aucun niveau pour l&apos;instant — cliquez sur « Ajouter un niveau ».
        </p>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-riwaq)]">
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
                Niveau affiché
              </label>
              <select
                value={niveauId ?? ""}
                onChange={(e) => setNiveauId(e.target.value || null)}
                className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
              >
                {niveaux.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" />
                Télécharger cette progression
              </Button>
              <Button
                variant="secondary"
                className="border-terracotta/40 text-terracotta-deep hover:bg-terracotta/10"
                onClick={handleDeleteNiveau}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer le niveau
              </Button>
            </div>
          </div>

          <Dropzone
            onImported={(text) => {
              if (textareaRef.current) textareaRef.current.value = text;
            }}
          />

          <div className="mt-4">
            <label className="mb-1 block text-[11.5px] uppercase tracking-wide text-ink-soft">
              Ou collez / modifiez vos chapitres (une ligne par chapitre, « Chapitre — période » possible)
            </label>
            <textarea
              key={niveauId ?? "none"}
              ref={textareaRef}
              rows={6}
              defaultValue={chaptersToText(progression)}
              placeholder={"Statistiques — Septembre\nCalcul littéral — Octobre\nTriangles — Novembre"}
              className="w-full resize-y rounded-lg border border-line bg-white p-2.5 font-sans text-[13.5px] leading-relaxed text-ink focus:border-terracotta-deep focus:outline-none focus:ring-1 focus:ring-terracotta-deep"
            />
          </div>
          <Button className="mt-2" onClick={handleSaveChapters} disabled={!niveauId}>
            Enregistrer la progression
          </Button>
        </div>
      )}

      {niveauId && niveau && (
        <>
          <div>
            <h2 className="mb-1 font-display text-[17px] font-semibold text-ink">
              Progression — {niveau.nom}
            </h2>
            <p className="mb-3.5 text-xs text-ink-soft">
              Touchez un titre ou une période pour le modifier. Appui long sur la poignée pour
              déplacer une ligne.
            </p>
            <ChapterList niveauId={niveauId} items={progression} />
          </div>
        </>
      )}
    </div>
  );
}
