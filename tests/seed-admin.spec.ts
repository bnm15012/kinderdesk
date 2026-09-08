import { test, expect } from "@playwright/test";

const ADMIN = { email: "admin@gmail.com", password: "Demo@1234" };

async function login(page: any, creds: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByPlaceholder("you@school.com").fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(schools|dashboard)/);
}

test.describe("Admin seed", () => {
  test("adds a branch, class and staff through the UI", async ({ page }) => {
    test.setTimeout(120000);
    await login(page, ADMIN);

    await test.step("Add a new branch", async () => {
      await page.getByRole("link", { name: "School & Branches" }).click();
      await page.getByRole("button", { name: /Add Branch/i }).click();
      await page.getByLabel("Branch name").fill("HSR Layout");
      await page.getByLabel("Address").fill("HSR Layout, Bangalore");
      await page.getByRole("button", { name: "Save Branch" }).click();
      await expect(page.getByText("HSR Layout")).toBeVisible();
    });

    await test.step("Add a class", async () => {
      await page.getByRole("link", { name: "Classes" }).click();
      await page.getByRole("button", { name: "Add Class" }).click();
      await page.getByLabel("Class name").fill("Playgroup A");
      await page.getByLabel("Age group").fill("2–3 years");
      await page.getByLabel("Capacity").fill("25");
      await page.getByRole("button", { name: "Save Class" }).click();
      await expect(page.getByText("Playgroup A")).toBeVisible();
    });

    await test.step("Add a receptionist staff", async () => {
      await page.getByRole("link", { name: "Staff" }).click();
      await page.getByRole("button", { name: "Add Staff" }).click();
      await page.getByLabel("First name").fill("Reception");
      await page.getByLabel("Last name").fill("Test");
      await page.getByLabel("Email").fill("reception-test@gmail.com");
      await page.getByLabel("Job title").fill("receptionist");
      await page.getByText("Send login invite").click();
      await page.getByRole("button", { name: "Save Staff" }).click();
      await page.getByRole("button", { name: "Copy link" }).click();
      await page.getByRole("button", { name: "Done" }).click();
      await expect(page.getByText("Reception Test")).toBeVisible();
    });
  });
});
