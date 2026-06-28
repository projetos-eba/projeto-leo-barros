import Link from "next/link";

type AccessBlockedProps = {
  description: string;
  title: string;
};

export function AccessBlocked({ description, title }: AccessBlockedProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <section className="glass-card mx-auto max-w-xl p-8">
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
          Acesso bloqueado
        </p>
        <h1 className="mt-3 text-3xl font-bold">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}

