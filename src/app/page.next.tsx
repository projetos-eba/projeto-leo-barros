const technicalChecks = [
  "App Router ativo",
  "React e TypeScript preservados",
  "Alias @/* disponível",
  "Aplicação Vite mantida em paralelo",
];

export default function NextFoundationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        background: "#0B1720",
        color: "#F9FAFB",
        fontFamily: "sans-serif",
      }}
    >
      <section style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>
        <p style={{ color: "#68AFE9", fontWeight: 700, letterSpacing: "0.08em" }}>
          FASE 1
        </p>
        <h1 style={{ margin: "12px 0", fontSize: 40 }}>
          Fundação Next.js pronta
        </h1>
        <p style={{ color: "#B9C2D0", fontSize: 18, lineHeight: 1.6 }}>
          Esta página confirma apenas a infraestrutura inicial. Nenhuma rota de
          negócio ou integração existente foi migrada.
        </p>

        <ul style={{ marginTop: 32, paddingLeft: 20, lineHeight: 2 }}>
          {technicalChecks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
