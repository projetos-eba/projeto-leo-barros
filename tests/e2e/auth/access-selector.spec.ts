import { expect, test } from "playwright/test";

test.describe("auth access selector", () => {
  test("routes each official profile card to its segmented login", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Quem/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Cliente/ })).toHaveAttribute("href", "/login");
    await expect(page.getByRole("link", { name: /Parceiro/ })).toHaveAttribute(
      "href",
      "/login/parceiros",
    );
    await expect(page.getByRole("link", { name: /Administrador/ })).toHaveAttribute(
      "href",
      "/login/admin",
    );
  });

  test("supports keyboard navigation from the first card", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /Cliente/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/login$/);
  });
});
