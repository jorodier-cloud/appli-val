import { ProgressionsManager } from "@/components/progressions-manager";

export default function ProgressionsPage() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-[46px] py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[29px] font-semibold text-ink">Mes progressions</h1>
        <p className="text-[14.5px] text-ink-soft">
          Une progression par niveau. Importez un fichier existant ou saisissez les chapitres.
        </p>
      </header>

      <ProgressionsManager />
    </main>
  );
}
