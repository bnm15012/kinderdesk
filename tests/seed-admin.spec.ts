import { test, expect } from "@playwright/test";

const ADMIN = { email: "admin@gmail.com", password: "Demo@1234" };

async function login(page: any, creds: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByPlaceholder("you@school.com").fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/dashboard");
}

test.describe("Admin seed", () => {
  test("creates branch and class through the UI", async ({ page }) => {
    test.setTimeout(120000);
    await login(page, ADMIN);

    await test.step("Add branch", async () => {
      await page.getByRole("link", { name: "School & Branches" }).click();
      await page.getByRole("button", { name: "Add Branch" }).click();
      await page.getByPlaceholder("e.g. South Branch").fill("HSR Layout");
      await page.getByPlaceholder("Street address").fill("HSR Layout, Bangalore");
      await page.getByPlaceholder("Mumbai").fill("Bangalore");
      await page.getByPlaceholder("Maharashtra").fill("Karnataka");
      await page.getByPlaceholder("400001").fill("560102");
      await page.getByRole("button", { name: "Add Branch" }).nth(1).click();
      await expect(page.getByRole("cell", { name: "HSR Layout" }).first()).toBeVisible();
    });

    await test.step("Add class", async () => {
      await page.getByRole("link", { name: "Classes" }).click();
      await page.getByRole("button", { name: "Add Class" }).click();
      await page.getByPlaceholder("e.g. Nursery A").fill("Playgroup A");
      await page.getByPlaceholder("e.g. 3–4 years").fill("2–3 years");
      await page.locator('input[type="number"]').first().fill("25");
      await page.getByRole("button", { name: "Save Class" }).click();
      await expect(page.getByText("Playgroup A").first()).toBeVisible();
    });
  });
});
