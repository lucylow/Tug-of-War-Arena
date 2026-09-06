import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nodeModulesPath = path.join(projectRoot, "node_modules");

try {
  const entries = await readdir(nodeModulesPath, { withFileTypes: true });
  const staleEntries = entries.filter((entry) => /(?:_tmp_|\.tmp$)/.test(entry.name));
  await Promise.all(
    staleEntries.map((entry) => rm(path.join(nodeModulesPath, entry.name), { recursive: true, force: true })),
  );
  if (staleEntries.length > 0) {
    console.log(`[metro-preflight] Removed ${staleEntries.length} stale temporary package path(s).`);
  }
} catch (error) {
  console.warn(
    "[metro-preflight] Cleanup skipped:",
    error instanceof Error ? error.message : String(error),
  );
}
