import { ClassesHub } from "@/components/classes-hub";

export default function ClassesPage() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-[46px] py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[29px] font-semibold text-ink">Mes classes</h1>
        <p className="text-[14.5px] text-ink-soft">
          Suivi individualisé par élève : notes, compétences, vie de classe.
        </p>
      </header>

      <ClassesHub />
    </main>
  );
}
