import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export interface ProcessorOptions {
  quality?: number | undefined;
  outDir?: string | undefined;
  isBatch?: boolean | undefined;
}

export interface ProcessingResult {
  outputPath: string;
  originalSize: number;
  newSize: number;
}

export async function processImage(
  filePath: string,
  options: ProcessorOptions,
): Promise<ProcessingResult> {
  const parsed = path.parse(filePath);

  const originalStat = await fs.stat(filePath);

  const quality = options.quality ? Number(options.quality) : 80;

  const targetFormatExt = parsed.ext.toLowerCase() || ".webp";

  let outputPath: string;

  if (options.outDir) {
    // Explicit --out-dir flag overrides
    outputPath = path.join(
      path.resolve(options.outDir),
      `${parsed.name}${targetFormatExt}`,
    );
  } else if (options.isBatch) {
    // Batch Mode: Auto-create ./output/
    const defaultBatchDir = path.join(process.cwd(), "output");
    outputPath = path.join(defaultBatchDir, `${parsed.name}${targetFormatExt}`);
  } else {
    // Single File Mode
    outputPath = path.join(
      parsed.dir,
      `${parsed.name}-optimized${targetFormatExt}`,
    );
  }

  // Ensure whatever directory we chose actually exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const pipeline = sharp(filePath);

  // Apply formatting dynamically depending on native extension
  switch (targetFormatExt) {
    case ".jpeg":
    case ".jpg":
      pipeline.jpeg({
        quality,
        mozjpeg: true, // Enables Mozilla's MozJPEG engine for aggressive compression
      });
      break;
    case ".webp":
      pipeline.webp({
        quality,
        effort: 6, // Max CPU effort for smallest file size
      });
      break;
    case ".avif":
      pipeline.avif({
        quality,
        effort: 9, // High effort AVIF encoding
      });
      break;
    case ".png":
    default:
      pipeline.png({
        quality,
        compressionLevel: 9,
        palette: true, // Required for 'quality' to apply lossy compression in PNGs
        effort: 10, // Max CPU effort for PNG quantization
      });
      break;
  }

  // Flush to disk
  const info = await pipeline.toFile(outputPath);

  return {
    outputPath,
    originalSize: originalStat.size,
    newSize: info.size,
  };
}
