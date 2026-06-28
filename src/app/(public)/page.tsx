import { FoundationValidation } from "../foundation-validation";

const technicalChecks = [
  "App Router ativo",
  "TanStack Query e Tooltip conectados",
  "Toasters shadcn e Sonner disponíveis",
  "Tailwind, tokens e classes customizadas preservados",
  "Aplicação Vite mantida em paralelo",
];

export default function NextFoundationPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <section className="glass-card page-enter mx-auto w-full max-w-3xl p-8">
        <p className="text-sm font-bold tracking-[0.08em] text-primary">
          FASE 3
        </p>
        <h1 className="mt-3 text-4xl font-bold">Shell público preservado</h1>
        <p className="mt-4 text-lg leading-7 text-muted-foreground">
          A fundação da Fase 2 permanece disponível enquanto os shells globais
          são preparados. Nenhuma tela de negócio foi migrada.
        </p>

        <ul className="stagger-fade-in mt-8 list-disc space-y-2 pl-5">
          {technicalChecks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>

        <FoundationValidation />
      </section>
    </main>
  );
}
