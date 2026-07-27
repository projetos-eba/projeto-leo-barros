# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: partner-shell.spec.ts >> partner shell >> keeps authenticated navigation, active data and reload stable
- Location: tests/e2e/partner-shell.spec.ts:22:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/parceiros\/dashboard$/
Received string:  "http://localhost:3000/login/parceiros"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    11 × unexpected value "http://localhost:3000/login/parceiros"
    - waiting for" http://localhost:3000/parceiros/dashboard" navigation to finish...
    - navigated to "http://localhost:3000/login/parceiros"
    - waiting for" http://localhost:3000/parceiros/dashboard" navigation to finish...

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- heading "Leonardo Barros" [level=1]
- paragraph: Saude | Nutricao | Performance
- paragraph: Parceiro
- heading "Login do Parceiro" [level=2]
- paragraph: Acesse sua área profissional para acompanhar clientes
- text: E-mail
- img
- textbox "E-mail":
  - /placeholder: seu@email.com
  - text: antonioferrari2002@gmail.com
- text: Senha
- link "Esqueceu a senha?":
  - /url: /login/parceiros/esqueci-senha
- img
- textbox "Senha":
  - /placeholder: ••••••••
  - text: "123456"
- button "Entrando..." [disabled]
- link "Não tenho cadastro":
  - /url: /login/parceiros/cadastro
- paragraph: Parceiros sem plano ativo serão direcionados para planos
- link "Escolher outro perfil":
  - /url: /
  - img
  - text: Escolher outro perfil
- alert
```

# Test source

```ts
  1  | import { expect, test, type Page } from "playwright/test";
  2  | 
  3  | const partner = {
  4  |   email: "antonioferrari2002@gmail.com",
  5  |   password: "123456",
  6  | };
  7  | 
  8  | async function signInAsSeededPartner(page: Page) {
  9  |   await page.goto("/login/parceiros");
  10 |   await page.getByLabel("E-mail").fill(partner.email);
  11 |   await page.getByLabel("Senha").fill(partner.password);
  12 |   await page.getByRole("button", { name: "Entrar" }).click();
> 13 |   await expect(page).toHaveURL(/\/parceiros\/dashboard$/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  14 | }
  15 | 
  16 | test.describe("partner shell", () => {
  17 |   test("redirects an unauthenticated visitor to the segmented login", async ({ page }) => {
  18 |     await page.goto("/parceiros/clientes");
  19 |     await expect(page).toHaveURL(/\/login\/parceiros$/);
  20 |   });
  21 | 
  22 |   test("keeps authenticated navigation, active data and reload stable", async ({ page }) => {
  23 |     await signInAsSeededPartner(page);
  24 | 
  25 |     for (const [label, href] of [
  26 |       ["Clientes", "/parceiros/clientes"],
  27 |       ["Planos & Financeiro", "/parceiros/planos-financeiro"],
  28 |       ["Agenda", "/parceiros/agenda"],
  29 |       ["Materiais", "/parceiros/materiais"],
  30 |       ["Cadastro", "/parceiros/cadastros"],
  31 |     ] as const) {
  32 |       const link = page.getByRole("link", { name: label }).first();
  33 |       await expect(link).toHaveAttribute("href", href);
  34 |     }
  35 | 
  36 |     await page.getByRole("link", { name: "Clientes" }).first().click();
  37 |     await expect(page).toHaveURL(/\/parceiros\/clientes$/);
  38 |     await expect(page.getByText("Ana Ribeiro").first()).toBeVisible();
  39 |     await page.reload();
  40 |     await expect(page.getByText("Ana Ribeiro").first()).toBeVisible();
  41 | 
  42 |     await page.getByRole("link", { name: "Agenda" }).first().click();
  43 |     await expect(page).toHaveURL(/\/parceiros\/agenda$/);
  44 |     await page.reload();
  45 |     await expect(page.getByRole("link", { name: "Agenda" }).first()).toHaveAttribute("aria-current", "page");
  46 |   });
  47 | 
  48 |   test("supports the mobile menu and signs out", async ({ page }) => {
  49 |     await signInAsSeededPartner(page);
  50 |     const menuButton = page.getByRole("button", { name: /menu|navegação/i }).first();
  51 |     await menuButton.click();
  52 |     await expect(page.getByRole("link", { name: "Materiais" }).last()).toBeVisible();
  53 | 
  54 |     await page.getByRole("button", { name: "Sair" }).last().click();
  55 |     await expect(page).toHaveURL(/\/login\/parceiros$/);
  56 |   });
  57 | });
  58 | 
```