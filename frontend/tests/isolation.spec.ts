import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("boards are isolated per user", async ({ page }) => {
  await login(page, "HP", "[HP123]");

  await page.getByText("Account Heat Map").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("HP Board");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600); // debounced save

  await page.getByRole("button", { name: "Sign out" }).click();
  await login(page, "JFrog", "[JFrog123]");

  await expect(page.getByText("HP Board")).toHaveCount(0);
  await expect(page.getByText("Account Heat Map")).toBeVisible();
});
