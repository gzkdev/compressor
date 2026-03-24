# @gzkdev/compress

A lightning-fast, zero-config image and SVG optimization CLI internally designed for modern web engineering.

Powered by `sharp` and `svgo`, this tool natively processes JPG, PNG, WebP, AVIF, GIF, TIFF, and SVG files asynchronously with massive multi-threaded concurrency.

---

## 🚀 Architectural Features

- **Blazing Fast Execution**: Leverages massive Node native multi-threading bounds via `p-map` to aggressively chew through 10,000 files concurrently without locking the CPU thread.
- **Native Vector Optimization**: Seamlessly intercepts `.svg` payloads to mathematically minify metadata via `svgo`, actively bypassing traditional raster pipelines.
- **Smart Resizing Boundaries**: Automatically locks images down against non-destructive aspect ratio walls (`--resize`), while preventing unoptimized pixels from permanently enlarging globally via internal `withoutEnlargement` boundaries.
- **Infinite Process Watcher**: Spins up a stable cross-platform `chokidar` UI terminal rendering engine natively observing memory structures when developers drop raw images into asset bounds!
- **Macroscopic UX UI**: An intricate React-Ink engine visually projecting massive CDN bandwidth analytics logic mathematically inside the standard CLI readout.

## 📦 Installation

```bash
npm install -D @gzkdev/compress
# or securely via pnpm
pnpm add -D @gzkdev/compress
```

## 🛠️ Usage

Simply point the CLI terminal argument directly toward the distinct files or entire directories you wish to compress!

```bash
# Process a raw folder cleanly into a compressed/ output folder natively
npx compress ./assets/raw

# Overwrite massive visual assets in-place recursively tracking your repo
npx compress ./assets/src --overwrite

# Boot into watch mode to continuously serve assets as they are dynamically populated
npx compress ./assets/raw -o ./public/images --watch

# Bulk resize all photos structurally down to 1920px max-width bounds 
npx compress ./assets/heroes --resize 1920x --overwrite
```

## ⚙️ Configuration Loading
If you don't want to continually track parameter flags repetitively over the CLI string, simply drop a native `compressor.config.json` (or `.js`, `.mjs`, `.ts`) anywhere inside your repository root!

The dynamic resolver natively searches up the file tree utilizing `cosmiconfig`:

```json
{
  "outDir": "./public/optimized",
  "quality": 80,
  "resize": "1920x1080",
  "overwrite": false
}
```

---

## 🔒 Husky & lint-staged CI Integration (Highly Recommended)

The absolute most fundamental strategy to securely utilize this engineering tool is enforcing architectural boundaries before developers commit heavy file bloat.

By hooking `@gzkdev/compress` directly natively into your `lint-staged` file configurations, the system automatically intercepts unoptimized image footprints right when a teammate attempts a `git commit`, minimizes the images fully in-place, and automatically passes the cleaned payloads transparently!

**package.json**
```json
{
  "lint-staged": {
    "src/**/*.{png,jpg,jpeg,webp,avif,svg}": [
      "compress --overwrite",
      "git add"
    ]
  }
}
```

> [!NOTE]
> **Is there a risk of generation loss?**
> No! Because `lint-staged` strictly isolates and passes *only newly staged files* to the CLI, your assets are compressed exactly **once** when they are first added or explicitly modified. They are completely ignored during all other unrelated commits, mathematically isolating them from any repeated JPEG/WebP generation loss!

*Now, unoptimized heavy memory payloads will literally never touch your `main` git history tree again.*
