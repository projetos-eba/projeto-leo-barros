import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const viteAppPath = resolve(process.cwd(), "src/App.tsx");
const nextPublicTokenRoute = resolve(
  process.cwd(),
  "src/app/(public)/form/[token]/page.next.tsx",
);
const nextTokenRoute = resolve(
  process.cwd(),
  "src/app/form/[token]/page.next.tsx",
);

describe("contrato da rota legada de formulário", () => {
  it("preserva a declaração Vite de /form/:token durante a transição", () => {
    const viteAppSource = readFileSync(viteAppPath, "utf8");

    expect(viteAppSource).toContain(
      '<Route path="/form/:token" element={<FormFill />} />',
    );
  });

  it("mantém suspensa a criação de uma rota pública equivalente no Next", () => {
    expect(existsSync(nextPublicTokenRoute)).toBe(false);
    expect(existsSync(nextTokenRoute)).toBe(false);
  });
});
