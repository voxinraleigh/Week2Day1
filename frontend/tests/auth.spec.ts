import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("rejects wrong password", async ({ page }) => {
  await page.goto("/login/");
  await page.getByLabel("Username").fill("HP");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid credentials")).toBeVisible();
});

test("logs in and out", async ({ page }) => {
  await login(page, "HP", "[HP123]");
  await expect(page.getByText("Next steps")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByLabel("Username")).toBeVisible();

  // Board is gated again after logout.
  await page.goto("/");
  await expect(page.getByLabel("Username")).toBeVisible();
});
