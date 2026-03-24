import { ShimmerSpinner } from "@/components/spinner";
import type { ProcessingResult } from "@/processors/image";
import { Box, Text } from "ink";
import logSymbols from "log-symbols";

interface AppProps {
  files?: string[];
  currentIndex?: number;
  status: "scanning" | "processing" | "done" | "watching";
  stats?: ProcessingResult[];
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function App({
  files = [],
  currentIndex = 0,
  status,
  stats = [],
}: AppProps) {
  if (status === "done") {
    if (files.length === 0) {
      return (
        <Box padding={1} flexDirection="column">
          <Text color="yellow">
            {logSymbols.warning} No files found to process.
          </Text>
        </Box>
      );
    }

    const totalOriginal = stats.reduce(
      (acc, curr) => acc + curr.originalSize,
      0,
    );
    const totalNew = stats.reduce((acc, curr) => acc + curr.newSize, 0);
    const savedBytes = totalOriginal - totalNew;
    const percentage =
      totalOriginal > 0
        ? ((savedBytes / totalOriginal) * 100).toFixed(1)
        : "0.0";

    // In rare cases (like forcing poor quality webp to high quality png), files get larger
    const isWorse = savedBytes < 0;

    return (
      <Box padding={1} flexDirection="column">
        <Box marginBottom={1}>
          <Text color="green" bold>
            {logSymbols.success} Successfully processed {stats.length} file(s)!
          </Text>
        </Box>

        {stats.length > 0 && (
          <Box
            flexDirection="column"
            paddingLeft={2}
            borderStyle="round"
            borderColor="cyan"
            paddingX={2}
          >
            <Text bold color="cyan">
              Compression Summary
            </Text>

            <Box marginTop={1} flexDirection="column">
              <Text>
                <Text color="gray">Original Size: </Text>{" "}
                {formatBytes(totalOriginal)}
              </Text>
              <Text>
                <Text color="gray">Final Size: </Text> {formatBytes(totalNew)}
              </Text>

              <Box marginTop={1}>
                <Text>
                  <Text color="gray">Efficiency: </Text>
                  <Text color={isWorse ? "red" : "green"} bold>
                    {isWorse ? "+" : "-"}
                    {Math.abs(Number(percentage))}%
                  </Text>
                  <Text color="gray">
                    {" "}
                    ({formatBytes(Math.abs(savedBytes))}{" "}
                    {isWorse ? "larger" : "saved"})
                  </Text>
                </Text>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  if (status === "scanning") {
    return (
      <Box padding={1}>
        <ShimmerSpinner />
        <Box paddingLeft={1}>
          <Text bold>Scanning file system...</Text>
        </Box>
      </Box>
    );
  }

  if (status === "watching") {
    return (
      <Box padding={1} flexDirection="column">
        <Box gap={1}>
          <ShimmerSpinner />
          <Text bold color="cyan">
            Watching for new files...
          </Text>
        </Box>
        <Box paddingLeft={3}>
          <Text color="gray" dimColor>
            (Press Ctrl+C to exit)
          </Text>
        </Box>
      </Box>
    );
  }

  // status === "processing"
  return (
    <Box padding={1} flexDirection="column">
      <Box gap={1}>
        <ShimmerSpinner />
        <Text bold>Compressing your files...</Text>
      </Box>

      {files.length > 0 && (
        <Box paddingLeft={3}>
          <Text color="gray" dimColor>
            [{currentIndex + 1}/{files.length}] {files[currentIndex]}
          </Text>
        </Box>
      )}
    </Box>
  );
}
