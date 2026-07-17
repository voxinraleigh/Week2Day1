import type { Locator, Page } from "@playwright/test";

export async function login(page: Page, username: string, password: string) {
  await page.goto("/login/");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByText("Sign out").waitFor();
}

export async function dragOnto(page: Page, source: Locator, target: Locator) {
  // The table scrolls horizontally; without this, elements can end up
  // off-screen (negative coordinates) after earlier column add/delete
  // actions, and mouse events dispatched there hit nothing.
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("Missing bounding box for drag");
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 20 },
  );
  await page.waitForTimeout(150);
  await page.mouse.move(
    targetBox.x + targetBox.width / 2 + 5,
    targetBox.y + targetBox.height / 2 + 5,
    { steps: 10 },
  );
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(300);
}
