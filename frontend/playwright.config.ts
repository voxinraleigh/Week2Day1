import os from "os";
import path from "path";
import { defineConfig } from "@playwright/test";

// A brand-new OS temp dir every run — e2e tests must never touch
// backend/data/app.db, and never reuse (or need to delete) a previous run's
// directory, which can still be locked by a just-exited server process.
const TEST_DB_DIR = path.join(os.tmpdir(), `heatmap-e2e-${process.pid}-${Date.now()}`);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  // A single shared SQLite file with no WAL/busy-timeout tuning can't take
  // concurrent writers from parallel workers ("database is locked") — run
  // serially instead, which is plenty fast for a suite this small.
  workers: 1,
  use: {
    baseURL: "http://localhost:8000",
  },
  webServer: {
    command: "npm run build && npm run e2e:serve",
    cwd: __dirname,
    url: "http://localhost:8000/login/",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_DIR: TEST_DB_DIR,
      DATABASE_FILENAME: "e2e-test.db",
    },
  },
});
