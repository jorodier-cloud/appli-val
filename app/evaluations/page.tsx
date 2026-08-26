import { CorrectionWorkspace } from "@/components/correction-workspace";

export const maxDuration = 120;

export default function EvaluationsPage() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-[46px] py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[29px] font-semibold text-ink">
          Évaluations &amp; correction IA
        </h1>
        <p className="text-[14.5px] text-ink-soft">
          Vous gardez la main sur chaque note — pré-correction assistée par IA
          vision pour copies manuscrites.
        </p>
      </header>

      <CorrectionWorkspace />
    </main>
  );
}
