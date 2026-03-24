#!/usr/bin/env node
import { render } from "ink";
import meow from "meow";
import { App } from "./app.js";
import { getFilesToProcess } from "./core/fs.js";
import type { ProcessingResult } from "./processors/image.js";
import { processImage } from "./processors/image.js";

const cli = meow(
  `
  Usage
    $ compress <paths...> [options]

  Options
    --input, -i   Explicitly provide input paths (can be used multiple times)
    --out-dir, -o The directory to output processed files
    --quality, -q Quality level (e.g. 80)
    --help        Show this help message

  Examples
    $ compress ./images --quality 80
    $ compress avatar.png --out-dir ./assets
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
    },
  },
);

async function run() {
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

  if (uniqueFiles.length === 0) {
    rerender(<App status="done" files={[]} stats={[]} />);
    unmount();
    return;
  }

  const isBatch = uniqueFiles.length > 1;
  const stats: ProcessingResult[] = [];

  for (let i = 0; i < uniqueFiles.length; i++) {
    rerender(
      <App
        status="processing"
        files={uniqueFiles}
        currentIndex={i}
        stats={stats}
      />,
    );

    try {
      const result = await processImage(uniqueFiles[i] as string, {
        outDir: cli.flags.outDir as string | undefined,
        quality: cli.flags.quality as number | undefined,
        isBatch,
      });
      stats.push(result);
    } catch {
      // Silently skip unsupported or broken files when explicitly passed
      continue;
    }
  }

  rerender(<App status="done" files={uniqueFiles} stats={stats} />);
  unmount();
}

run();
