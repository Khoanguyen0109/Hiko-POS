/**
 * Railway startup script.
 * Runs the multi-store migration (idempotent, safe on every deploy),
 * then starts the main application.
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migrationScript = path.join(__dirname, "..", "seeds", "migrateToMultiStore.js");

console.log("=== Running multi-store migration ===");

(async () => {
  try {
    execSync(`node "${migrationScript}" --force`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log("=== Migration complete ===\n");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Migration failed, but starting server anyway:", msg);
  }

  await import("../app.js");
})();
