import { test, expect, type Page } from "@playwright/test";

async function navigate(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
}

test("roadmap and skills persist, score updates and learning is recorded once per day", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Build on what you know." }),
  ).toBeVisible();
  await navigate(page, "Roadmap");
  await page.getByRole("checkbox", { name: "Complete SQLBolt" }).check();
  await page.locator("#sql-0 summary").click();
  await page
    .getByLabel("Complete SQLBolt notes")
    .fill("Completed joins and grouping.");
  await page.reload();
  await navigate(page, "Roadmap");
  await expect(
    page.getByRole("checkbox", { name: "Complete SQLBolt" }),
  ).toBeChecked();
  await page.locator("#sql-0 summary").click();
  await expect(page.getByLabel("Complete SQLBolt notes")).toHaveValue(
    "Completed joins and grouping.",
  );
  await navigate(page, "Dashboard");
  await expect(page.locator(".score-ring strong")).toContainText("7");
  await expect(page.locator(".streak")).toContainText("1");
  await expect(
    page.getByRole("button", { name: "Today recorded" }),
  ).toBeDisabled();
  await navigate(page, "Skill Gap Analysis");
  await page.getByLabel("SQL current level", { exact: true }).fill("3");
  await page.reload();
  await navigate(page, "Skill Gap Analysis");
  await expect(
    page.getByLabel("SQL current level", { exact: true }),
  ).toHaveValue("3");
});

test("opportunities support add, edit, filter, persistence and delete", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Job Tracker");
  await page
    .getByRole("button", { name: "Add opportunity", exact: true })
    .click();
  await page.getByLabel("Company", { exact: true }).fill("Research DAO");
  await page.getByLabel("Role", { exact: true }).fill("Governance Analyst");
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Interview");
  await page.getByLabel("Application Date", { exact: true }).fill("2026-01-02");
  await page.getByLabel("Fit Score (0–100)").fill("92");
  await page.getByLabel("Salary", { exact: true }).fill("€75,000");
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Remote Europe. Risk analysis.");
  await page.getByRole("button", { name: "Save opportunity" }).click();
  await expect(page.getByRole("cell", { name: "€75,000" })).toBeVisible();
  await page.getByLabel("Filter by status").selectOption("Offer");
  await expect(page.getByText("No matching opportunities")).toBeVisible();
  await page.getByLabel("Filter by status").selectOption("All statuses");
  await page.getByRole("button", { name: "Edit Research DAO" }).click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Rejected");
  await page.getByRole("button", { name: "Save opportunity" }).click();
  await page.reload();
  await navigate(page, "Job Tracker");
  await expect(
    page.getByRole("cell", { name: "Rejected", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".metric").filter({ hasText: "Interviews" }).locator("strong"),
  ).toHaveText("1");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete Research DAO" }).click();
  await expect(page.getByText("Your next role starts here")).toBeVisible();
});

test("portfolio publication changes score and can be edited and deleted", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Project Portfolio");
  await page.getByRole("button", { name: "Add project", exact: true }).click();
  await page.getByLabel("Project Name").fill("Protocol risk dashboard");
  await page.getByLabel("Protocol", { exact: true }).fill("Aave");
  await page.getByLabel("Completion %").fill("100");
  await page
    .getByLabel("Publication Link")
    .fill("https://dune.com/example/research");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("link", { name: "View publication" }),
  ).toHaveAttribute("href", "https://dune.com/example/research");
  await navigate(page, "Dashboard");
  await expect(page.locator(".score-ring strong")).toContainText("12");
  await page.reload();
  await navigate(page, "Project Portfolio");
  await page
    .getByRole("button", { name: "Edit Protocol risk dashboard" })
    .click();
  await page.getByLabel("Completion %").fill("50");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("progressbar", {
      name: "Protocol risk dashboard completion",
    }),
  ).toHaveAttribute("aria-valuenow", "50");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete Protocol risk dashboard" })
    .click();
  await expect(page.getByText("Make your experience visible")).toBeVisible();
});

test("weekly review retains answers and historical score after reload", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Weekly Review");
  const fields = page.locator("textarea");
  for (let i = 0; i < 4; i++)
    await fields.nth(i).fill(`Weekly answer ${i + 1}`);
  await page.getByLabel("Career score this week", { exact: true }).fill("8");
  await page.getByRole("button", { name: "Save weekly review" }).click();
  await expect(page.getByRole("status")).toHaveText("Weekly review saved.");
  await page.reload();
  await navigate(page, "Weekly Review");
  await page.locator(".history-item summary").click();
  await expect(
    page.getByText("Weekly answer 4", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".history-item summary strong")).toHaveText("8/10");
});

test("backup restores data and invalid storage is not silently overwritten", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Roadmap");
  await page.getByRole("checkbox", { name: "Complete SQLBolt" }).check();
  const backup = await page.evaluate(() =>
    localStorage.getItem("web3-career-hub:v1"),
  );
  await page.evaluate(() =>
    localStorage.setItem("web3-career-hub:v1", "broken"),
  );
  await page.reload();
  await expect(page.locator(".storage-error")).toContainText(
    "Saved data could not be read",
  );
  await navigate(page, "Roadmap");
  await page.getByRole("checkbox", { name: "Complete SQLBolt" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("web3-career-hub:v1")),
  ).toBe("broken");
  page.once("dialog", (d) => d.accept());
  await page
    .getByLabel("Restore career backup")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup!),
    });
  await expect(page.locator(".storage-error")).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Complete SQLBolt" }),
  ).toBeChecked();
  await page
    .getByLabel("Restore career backup")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":2}'),
    });
  await expect(page.getByRole("status")).toContainText("not a valid V1");
});

test("mobile navigation and layouts fit a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  for (const name of [
    "Dashboard",
    "Roadmap",
    "Skill Gap Analysis",
    "Job Tracker",
    "Project Portfolio",
    "Weekly Review",
  ]) {
    await nav.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.screenshot({
    path: "test-results/mobile-dashboard.png",
    fullPage: true,
  });
});

test("desktop dashboard renders without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1512, height: 1050 });
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Build on what you know.");
  await page.screenshot({
    path: "test-results/desktop-dashboard.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
