import fs from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const SUPPORTED_FORMATS = new Set([
  ".webp",
  ".jpeg",
  ".jpg",
  ".png",
  ".avif",
  ".gif",
  ".tiff",
]);

const RED = "\x1b[31m";
const RESET = "\x1b[0m";

export async function getFilesToProcess(targetPath: string): Promise<string[]> {
  const absolutePath = resolve(targetPath);

  try {
    const stats = await fs.stat(absolutePath);

    if (stats.isFile()) {
      return [absolutePath];
    }

    if (stats.isDirectory()) {
      return await scanDirectory(absolutePath);
    }

    return [];
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(
        `${RED}Error: The path "${targetPath}" does not exist.${RESET}`,
      );
      process.exit(1);
    }

    const msg = error instanceof Error ? error.message : String(error);
    console.error(`${RED}Error reading path: ${msg}${RESET}`);
    process.exit(1);
  }
}

async function scanDirectory(path: string): Promise<string[]> {
  const entries = await fs.readdir(path, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(path, entry.name);

    if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (SUPPORTED_FORMATS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}
