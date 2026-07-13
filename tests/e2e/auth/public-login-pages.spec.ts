import { expect, test } from "playwright/test";

test.describe("public segmented auth pages", () => {
  test("client login has first access and forgot password but no public signup", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /Login do Cliente/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Primeiro acesso/ })).toHaveAttribute(
      "href",
      "/login/primeiro-acesso",
    );
    await expect(page.getByRole("link", { name: /Esqueceu a senha/ })).toHaveAttribute(
      "href",
      "/login/esqueci-senha",
    );
    await expect(page.locator('a[href*="cadastro"]')).toHaveCount(0);
  });

  test("partner login exposes public signup and forgot password", async ({ page }) => {
    await page.goto("/login/parceiros");

    await expect(page.getByRole("heading", { name: /Login do Parceiro/ })).toBeVisible();
    await expect(page.locator('a[href="/login/parceiros/cadastro"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Esqueceu a senha/ })).toHaveAttribute(
      "href",
      "/login/parceiros/esqueci-senha",
    );
  });

  test("partner login preserves selected checkout plan through signup", async ({ page }) => {
    await page.goto(
      "/login/parceiros?next=/parceiros/checkout?plan=complete-annual",
    );

    await expect(page.locator(
      'a[href="/login/parceiros/cadastro?next=%2Fparceiros%2Fcheckout%3Fplan%3Dcomplete-annual"]',
    )).toBeVisible();
  });

  test("admin login has forgot password and no public signup", async ({ page }) => {
    await page.goto("/login/admin");

    await expect(page.getByRole("heading", { name: /Admin/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Esqueceu a senha/ })).toHaveAttribute(
      "href",
      "/login/admin/esqueci-senha",
    );
    await expect(page.locator('a[href*="cadastro"]')).toHaveCount(0);
  });
});
