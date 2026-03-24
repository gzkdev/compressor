#!/usr/bin/env node
import { App } from "@/app";
import { loadConfig } from "@/core/config";
import { getFilesToProcess, SUPPORTED_FORMATS } from "@/core/fs";
import { processImage, type ProcessingResult } from "@/processors/image";
import chalk from "chalk";
import chokidar from "chokidar";
import { render } from "ink";
import logSymbols from "log-symbols";
import meow from "meow";
import path from "node:path";
import pMap from "p-map";

const cli = meow(
  `
  Usage
    $ compress <paths...> [options]

  Options
    --input, -i   Explicitly provide input paths (can be used multiple times)
    --out-dir, -o The directory to output processed files
    --quality, -q Quality level (e.g. 80)
    --watch, -w   Watch input files and auto-process on changes
    --overwrite   Overwrite the original files directly
    --resize      Resize large structures down (e.g. 1920x1080 or 1920x)
    --help        Show this help message

  Examples
    $ compress ./images --quality 80
    $ compress avatar.png --out-dir ./assets
    $ compress ./images --watch
`,
  {
    importMeta: import.meta,
    flags: {
      input: {
        type: "string",
        shortFlag: "i",
        isMultiple: true,
      },
      outDir: {
        type: "string",
        shortFlag: "o",
      },
      quality: {
        type: "number",
        shortFlag: "q",
      },
      watch: {
        type: "boolean",
        shortFlag: "w",
      },
      overwrite: {
        type: "boolean",
      },
      resize: {
        type: "string",
      },
    },
  },
);

async function run() {
  const config = await loadConfig();

  const watchMode = cli.flags.watch || config.watch;
  const finalOverwrite = cli.flags.overwrite || config.overwrite;
  const finalOutDir = (cli.flags.outDir as string | undefined) || config.outDir;
  const finalQuality =
    (cli.flags.quality as number | undefined) || config.quality;
  const finalResize = (cli.flags.resize as string | undefined) || config.resize;

  if (watchMode && finalOverwrite) {
    console.error(
      `${logSymbols.error} ${chalk.red("Error: Cannot use --watch and --overwrite at the same time to prevent infinite loops.")}`,
    );
    process.exit(1);
  }

  const { rerender, unmount } = render(<App status="scanning" />);

  const positionalInputs = cli.input;
  const flagInputs = (cli.flags.input as string[]) || [];
  const rawPaths = [...positionalInputs, ...flagInputs];

  if (rawPaths.length === 0) {
    unmount();
    cli.showHelp(0);
    return;
  }

  const filePaths: string[] = [];
  for (const rawPath of rawPaths) {
    const files = await getFilesToProcess(rawPath);
    filePaths.push(...files);
  }

  const uniqueFiles = [...new Set(filePaths)];

  if (uniqueFiles.length === 0 && !watchMode) {
    rerender(<App status="done" files={[]} stats={[]} />);
    unmount();
    return;
  }

  const isBatch = uniqueFiles.length > 1 || rawPaths.length > 1 || watchMode;
  const stats: ProcessingResult[] = [];

  const processFiles = async (filesToProcess: string[]) => {
    let processedCount = 0;
    await pMap(
      filesToProcess,
      async (filePath) => {
        try {
          const result = await processImage(filePath, {
            outDir: finalOutDir,
            quality: finalQuality,
            overwrite: finalOverwrite,
            resize: finalResize,
            isBatch,
          });
          stats.push(result);
        } catch {
          // Skip invalid files silently
        } finally {
          processedCount++;
          rerender(
            <App
              status="processing"
              files={filesToProcess}
              processedCount={processedCount}
              stats={stats}
            />,
          );
        }
      },
      { concurrency: 10 },
    );
  };

  if (uniqueFiles.length > 0) {
    await processFiles(uniqueFiles);
  }

  if (watchMode) {
    rerender(<App status="watching" files={[]} stats={stats} />);

    const watcher = chokidar.watch(rawPaths, {
      ignored: (filePath, stats) => {
        // ALWAYS allow dotfiles to be strictly ignored
        if (path.basename(filePath).startsWith(".")) return true;

        // ALWAYS allow directories to be scanned so chokidar can recurse deeply
        if (!stats || stats.isDirectory()) return false;

        // Block any file that doesn't have a supported web media extension
        const ext = path.extname(filePath).toLowerCase();
        return !SUPPORTED_FORMATS.has(ext);
      },
      persistent: true,
      ignoreInitial: true,
    });

    const handleEvent = async (filePath: string) => {
      // Prevent infinite loops by blocking output directory watch triggers
      if (finalOutDir && filePath.includes(finalOutDir)) return;
      if (
        filePath.includes("compressed") ||
        filePath.includes("compressor") ||
        filePath.includes(".compressed")
      )
        return;

      await processFiles([filePath]);
      rerender(<App status="watching" files={[]} stats={stats} />);
    };

    watcher.on("add", handleEvent);
    watcher.on("change", handleEvent);

    return; // Leave the process hanging
  }

  rerender(<App status="done" files={uniqueFiles} stats={stats} />);
  unmount();
}

run();
