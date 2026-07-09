export default function PlansPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="glass-card page-enter w-full max-w-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
          Planos
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          Escolha um plano para continuar
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          TODO: integrar selecao de planos, checkout e billing real quando a
          configuracao comercial for aprovada.
        </p>
      </section>
    </main>
  );
}
