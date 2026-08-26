import { EvaluationsManager } from "@/components/evaluations-manager";

export const maxDuration = 60;

export default function EvaluationsPage() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-[46px] py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[29px] font-semibold text-ink">
          Évaluations &amp; correction
        </h1>
        <p className="text-[14.5px] text-ink-soft">
          Photo prise, note entrée le jour J → corrigé détaillé généré → restitution et
          auto-correction dès le lendemain.
        </p>
      </header>

      <EvaluationsManager />
    </main>
  );
}
