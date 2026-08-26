import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="flex min-h-screen max-w-[1180px] flex-col gap-6 px-[46px] py-[38px]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[29px] font-semibold text-ink">
          Bonjour
        </h1>
        <p className="text-[14.5px] text-ink-soft">
          Vos progressions et vos derniers supports, en un coup d&apos;œil.
        </p>
      </header>

      <Dashboard />
    </main>
  );
}
