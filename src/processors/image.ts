import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { optimize } from "svgo";

export interface ProcessorOptions {
  quality?: number | undefined;
  outDir?: string | undefined;
  isBatch?: boolean | undefined;
  overwrite?: boolean | undefined;
  resize?: string | undefined;
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

  if (options.overwrite) {
    outputPath = filePath;
  } else if (options.outDir) {
    // Explicit --out-dir flag overrides
    outputPath = path.join(
      path.resolve(options.outDir),
      `${parsed.name}${targetFormatExt}`,
    );
  } else if (options.isBatch) {
    // Batch Mode: Auto-create ./compressed/
    const defaultBatchDir = path.join(process.cwd(), "compressed");
    outputPath = path.join(defaultBatchDir, `${parsed.name}${targetFormatExt}`);
  } else {
    // Single File Mode
    outputPath = path.join(
      parsed.dir,
      `${parsed.name}.compressed${targetFormatExt}`,
    );
  }

  // Ensure whatever directory we chose actually exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  if (targetFormatExt === ".svg") {
    const svgString = await fs.readFile(filePath, "utf-8");
    const result = optimize(svgString, {
      path: filePath,
      multipass: true,
    });

    await fs.writeFile(outputPath, result.data);
    const infoSize = Buffer.byteLength(result.data, "utf8");

    return {
      outputPath,
      originalSize: originalStat.size,
      newSize: infoSize,
    };
  }

  const pipeline = sharp(filePath);

  if (options.resize) {
    const [widthStr, heightStr] = options.resize.toLowerCase().split("x");
    pipeline.resize({
      width: widthStr ? parseInt(widthStr, 10) : undefined,
      height: heightStr ? parseInt(heightStr, 10) : undefined,
      fit: "inside", // Retain aspect ratio perfectly without destructive cropping
      withoutEnlargement: true, // Only scale down natively, NEVER expand pixel grids
    });
  }

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

  const isOverwriting = options.overwrite && outputPath === filePath;
  const tempPath = isOverwriting ? `${outputPath}.tmp` : outputPath;

  // Flush to disk
  const info = await pipeline.toFile(tempPath);

  if (isOverwriting) {
    await fs.rename(tempPath, outputPath);
  }

  return {
    outputPath,
    originalSize: originalStat.size,
    newSize: info.size,
  };
}
