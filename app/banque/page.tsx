import { BanqueRessources } from "@/components/banque-ressources";

export default function BanquePage() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-4 pb-28 pt-6 md:px-[46px] md:py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[25px] font-semibold md:text-[29px] text-ink">
          Banque de ressources
        </h1>
        <p className="text-[14.5px] text-ink-soft">
          Tout ce que vous avez déjà créé, classé et réutilisable.
        </p>
      </header>

      <BanqueRessources />
    </main>
  );
}
