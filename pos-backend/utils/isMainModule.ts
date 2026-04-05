import { fileURLToPath } from "node:url";

/** True when this file is the process entrypoint (replaces `require.main === module`). */
export function isMainModule(metaUrl: string): boolean {
  return process.argv[1] === fileURLToPath(metaUrl);
}
