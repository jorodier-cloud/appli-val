import { ProgressionManager } from "@/components/progression-manager";

export const maxDuration = 60;

export default function GenerateurPage() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-[46px] py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[29px] font-semibold text-ink">
          Générateur de supports
        </h1>
        <p className="text-[14.5px] text-ink-soft">
          Progression annuelle par niveau, questions flash, support de cours,
          fiches d&apos;exercices, évaluations et révision espacée — depuis la
          banque existante ou par génération IA.
        </p>
      </header>

      <ProgressionManager />
    </main>
  );
}
