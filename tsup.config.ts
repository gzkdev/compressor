import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.tsx"],
  format: ["esm"],
  dts: true,
  target: "node18",
  clean: true,
  minify: false,
});
