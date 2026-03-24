import chalk from "chalk";
import { cosmiconfig } from "cosmiconfig";
import logSymbols from "log-symbols";

export interface CompressorConfig {
  outDir?: string;
  quality?: number;
  watch?: boolean;
  overwrite?: boolean;
}

const explorer = cosmiconfig("compressor");

export async function loadConfig(): Promise<CompressorConfig> {
  try {
    const result = await explorer.search();
    if (result && !result.isEmpty) {
      return result.config as CompressorConfig;
    }
  } catch {
    console.warn(
      `${logSymbols.warning} ${chalk.yellow("Warning: Invalid compressor configuration file found. Falling back to defaults.")}`,
    );
  }
  return {};
}
