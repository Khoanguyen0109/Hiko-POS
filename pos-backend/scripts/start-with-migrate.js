/**
 * Railway startup script.
 * Runs the multi-store migration (idempotent, safe on every deploy),
 * then starts the main application.
 */

const { execSync } = require("child_process");
const path = require("path");

const migrationScript = path.join(__dirname, "..", "seeds", "migrateToMultiStore.js");

console.log("=== Running multi-store migration ===");

try {
  execSync(`node "${migrationScript}" --force`, {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("=== Migration complete ===\n");
} catch (err) {
  console.error("Migration failed, but starting server anyway:", err.message);
}

require("../app.js");
