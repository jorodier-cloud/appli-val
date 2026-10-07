export const metadata = { title: "Accès — Riwaq" };

export default async function PageAcces({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        method="post"
        action="/api/acces"
        className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 shadow-riwaq"
      >
        <h1 className="font-display text-2xl text-ink">Riwaq</h1>
        <p className="mt-2 text-sm text-ink-soft">Saisissez le code d&apos;accès.</p>
        <label htmlFor="code" className="sr-only">
          Code d&apos;accès
        </label>
        <input
          id="code"
          name="code"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-6 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta"
        />
        {erreur ? (
          <p role="alert" className="mt-3 text-sm text-terracotta-deep">
            Code incorrect.
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-deep"
        >
          Entrer
        </button>
      </form>
    </main>
  );
}
