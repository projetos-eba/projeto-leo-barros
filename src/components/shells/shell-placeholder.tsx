import type { ReactNode } from "react";

type ShellPlaceholderProps = {
  description: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
};

export function ShellPlaceholder({
  children,
  description,
  eyebrow,
  title,
}: ShellPlaceholderProps) {
  return (
    <section className="glass-card page-enter p-6 md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        {description}
      </p>
      {children}
    </section>
  );
}
