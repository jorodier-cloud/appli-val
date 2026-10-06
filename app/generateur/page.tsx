import { GenerateurCards } from "@/components/generateur-cards";

export const maxDuration = 120;

export default function GenerateurPage() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-4 pb-28 pt-6 md:px-[46px] md:py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[25px] font-semibold md:text-[29px] text-ink">Générateur de supports</h1>
        <p className="text-[14.5px] text-ink-soft">
          Le chapitre est repris de votre progression. Le résultat s&apos;enregistre dans la banque.
        </p>
      </header>

      <GenerateurCards />
    </main>
  );
}
