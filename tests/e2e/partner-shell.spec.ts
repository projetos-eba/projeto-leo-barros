import { expect, test, type Page } from "playwright/test";

const partner = {
  email: "antonioferrari2002@gmail.com",
  password: "123456",
};

async function signInAsSeededPartner(page: Page) {
  await page.goto("/login/parceiros");
  await page.getByLabel("E-mail").fill(partner.email);
  await page.getByLabel("Senha").fill(partner.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/parceiros\/dashboard$/);
}

test.describe("partner shell", () => {
  test("redirects an unauthenticated visitor to the segmented login", async ({ page }) => {
    await page.goto("/parceiros/clientes");
    await expect(page).toHaveURL(/\/login\/parceiros$/);
  });

  test("keeps authenticated navigation, active data and reload stable", async ({ page }) => {
    await signInAsSeededPartner(page);

    for (const [label, href] of [
      ["Clientes", "/parceiros/clientes"],
      ["Planos & Financeiro", "/parceiros/planos-financeiro"],
      ["Agenda", "/parceiros/agenda"],
      ["Materiais", "/parceiros/materiais"],
      ["Cadastro", "/parceiros/cadastros"],
    ] as const) {
      const link = page.getByRole("link", { name: label }).first();
      await expect(link).toHaveAttribute("href", href);
    }

    await page.getByRole("link", { name: "Clientes" }).first().click();
    await expect(page).toHaveURL(/\/parceiros\/clientes$/);
    await expect(page.getByText("Ana Ribeiro").first()).toBeVisible();
    await page.reload();
    await expect(page.getByText("Ana Ribeiro").first()).toBeVisible();

    await page.getByRole("link", { name: "Agenda" }).first().click();
    await expect(page).toHaveURL(/\/parceiros\/agenda$/);
    await page.reload();
    await expect(page.getByRole("link", { name: "Agenda" }).first()).toHaveAttribute("aria-current", "page");
  });

  test("supports the mobile menu and signs out", async ({ page }) => {
    await signInAsSeededPartner(page);
    const menuButton = page.getByRole("button", { name: /menu|navegação/i }).first();
    await menuButton.click();
    await expect(page.getByRole("link", { name: "Materiais" }).last()).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).last().click();
    await expect(page).toHaveURL(/\/login\/parceiros$/);
  });
});
