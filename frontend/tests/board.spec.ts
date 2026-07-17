import { test, expect } from "@playwright/test";
import { login, dragOnto } from "./helpers";

function indexOfSubstring(values: string[], needle: string): number {
  return values.findIndex((v) => v.includes(needle));
}

test("full golden path: columns, accounts, entries, dialogs, persistence", async ({
  page,
}) => {
  await login(page, "Elastic", "[Elastic123]");

  // Add + rename a column.
  await page.getByRole("button", { name: "Add column" }).click();
  await page.getByText("New technology").first().click();
  await page.keyboard.type("Endpoint");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Endpoint")).toBeVisible();

  // Add + rename an account.
  await page.getByRole("button", { name: "+ Add account" }).click();
  await page.getByText("Account name").first().click();
  await page.keyboard.type("Acme Corp");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Acme Corp")).toBeVisible();

  const row = page.locator(".grid.border-b").first();

  // Add two entries to the first cell.
  await row.getByRole("button", { name: "+ add" }).first().click();
  await row.getByText("New entry").first().click();
  await page.keyboard.type("Cisco");
  await page.keyboard.press("Enter");

  await row.getByRole("button", { name: "+ add" }).first().click();
  await row.getByText("New entry").first().click();
  await page.keyboard.type("Fortinet");
  await page.keyboard.press("Enter");

  await expect(row.getByText("Cisco")).toBeVisible();
  await expect(row.getByText("Fortinet")).toBeVisible();

  // Entry delete dialog: cancel keeps it.
  await row.getByRole("button", { name: "Delete entry" }).first().click();
  await expect(page.getByText("Delete this entry?")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(row.getByText("Cisco")).toBeVisible();

  // Entry delete dialog: confirm removes it.
  await row.getByRole("button", { name: "Delete entry" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(row.getByText("Cisco")).toHaveCount(0);
  await expect(row.getByText("Fortinet")).toBeVisible();

  // Fill the pinned "Next steps" cell too (last "+ add" in the row).
  await row.getByRole("button", { name: "+ add" }).last().click();
  await row.getByText("New entry").first().click();
  await page.keyboard.type("Renew contract");
  await page.keyboard.press("Enter");
  await expect(row.getByText("Renew contract")).toBeVisible();

  // Right-click sort on a column header shouldn't throw with one row.
  await page.getByText("AI Tools", { exact: true }).click({ button: "right" });

  // Column delete dialog: cancel keeps it.
  const endpointHeader = page
    .getByText("Endpoint", { exact: true })
    .locator("xpath=..");
  await endpointHeader.getByRole("button", { name: "Delete column" }).click();
  await expect(page.getByText('Delete the "Endpoint" column?')).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Endpoint")).toBeVisible();

  // Column delete dialog: confirm removes it.
  await endpointHeader.getByRole("button", { name: "Delete column" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Endpoint")).toHaveCount(0);

  // Column drag-and-drop reorder: drag "AI Strategy" onto "AI Tools".
  // The drag listeners live on the handle button, not the header's outer div.
  const headerCells = page.locator(".grid.border-b-2 > div");
  const columnsBefore = (await headerCells.allTextContents()).map((t) => t.trim());
  const aiStrategyHeader = page
    .getByText("AI Strategy", { exact: true })
    .locator("xpath=..");
  const aiToolsHeader = page.getByText("AI Tools", { exact: true }).locator("xpath=..");
  await dragOnto(
    page,
    aiStrategyHeader.getByRole("button", { name: "Drag to reorder column" }),
    aiToolsHeader.getByRole("button", { name: "Drag to reorder column" }),
  );
  await page.waitForTimeout(300);
  const columnsAfter = (await headerCells.allTextContents()).map((t) => t.trim());
  expect(columnsAfter).not.toEqual(columnsBefore);
  expect(indexOfSubstring(columnsAfter, "AI Strategy")).toBeLessThan(
    indexOfSubstring(columnsAfter, "AI Tools"),
  );

  // Row drag-and-drop: add a second account, then reorder rows.
  await page.getByRole("button", { name: "+ Add account" }).click();
  await page.getByText("Account name").first().click();
  await page.keyboard.type("Beta Inc");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);

  const rows = page.locator(".grid.border-b");
  await expect(rows).toHaveCount(2);
  const accountsBefore = (await rows.allTextContents()).map((t) => t.trim());
  await dragOnto(
    page,
    page.getByRole("button", { name: "Drag to reorder account" }).last(),
    page.getByRole("button", { name: "Drag to reorder account" }).first(),
  );
  await page.waitForTimeout(300);
  const accountsAfter = (await rows.allTextContents()).map((t) => t.trim());
  expect(accountsAfter).not.toEqual(accountsBefore);
  expect(indexOfSubstring(accountsAfter, "Beta Inc")).toBeLessThan(
    indexOfSubstring(accountsAfter, "Acme Corp"),
  );

  // Account delete dialog: cancel then confirm.
  const betaRow = page.locator(".grid.border-b", { hasText: "Beta Inc" });
  await betaRow.getByRole("button", { name: "Delete account" }).click();
  await expect(page.getByText('Delete the "Beta Inc" account?')).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Beta Inc")).toBeVisible();

  await betaRow.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Beta Inc")).toHaveCount(0);

  // Reload and confirm everything persisted.
  await page.waitForTimeout(700); // debounced save
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Acme Corp")).toBeVisible();
  await expect(page.getByText("Fortinet")).toBeVisible();
  await expect(page.getByText("Renew contract")).toBeVisible();
  await expect(page.getByText("Endpoint")).toHaveCount(0);
  await expect(page.getByText("Beta Inc")).toHaveCount(0);
});
