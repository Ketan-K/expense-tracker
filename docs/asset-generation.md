# Theme Assets Generation Guide

This guide explains how to generate theme-specific assets for different themes.

## Required Assets

Each theme requires the following assets in the `public/` folder:

### Vibe Finance Theme

- `favicon-vibe.ico` - 16x16, 32x32, 48x48 favicon
- `apple-touch-icon-vibe.png` - 180x180 Apple touch icon
- `icon-192x192.png` - 192x192 PWA icon
- `icon-512x512.png` - 512x512 PWA icon
- `og-image-vibe.png` - 1200x630 Open Graph image

### Default Theme

- `favicon.ico` - 16x16, 32x32, 48x48 favicon
- `apple-touch-icon.png` - 180x180 Apple touch icon
- `icon-192x192.png` - 192x192 PWA icon
- `icon-512x512.png` - 512x512 PWA icon

## Generation Methods

### Option 1: Using Online Tools

1. **Favicon Generator**: https://realfavicongenerator.net/
   - Upload your logo SVG
   - Customize settings for each platform
   - Download and extract to `public/` folder

2. **PWA Icon Generator**: https://www.pwabuilder.com/imageGenerator
   - Upload base icon (512x512 recommended)
   - Generate all required sizes
   - Download and place in `public/` folder

### Option 2: Using ImageMagick (Command Line)

```bash
# Convert SVG to PNG (requires ImageMagick)
magick convert -background none logo-vibe.svg -resize 512x512 icon-512x512.png
magick convert -background none logo-vibe.svg -resize 192x192 icon-192x192.png
magick convert -background none logo-vibe.svg -resize 180x180 apple-touch-icon-vibe.png

# Create favicon.ico with multiple sizes
magick convert logo-vibe.svg -define icon:auto-resize=48,32,16 favicon-vibe.ico
```

### Option 3: Using Node.js (sharp library)

```bash
npm install --save-dev sharp
```

Create `scripts/generate-icons.js`:

```javascript
const sharp = require("sharp");
const fs = require("fs");

const sizes = [
  { size: 16, output: "favicon-vibe.ico" },
  { size: 180, output: "apple-touch-icon-vibe.png" },
  { size: 192, output: "icon-192x192.png" },
  { size: 512, output: "icon-512x512.png" },
];

async function generateIcons() {
  for (const { size, output } of sizes) {
    await sharp("public/logo-vibe.svg").resize(size, size).png().toFile(`public/${output}`);
    console.log(`Generated ${output}`);
  }
}

generateIcons();
```

Run: `node scripts/generate-icons.js`

## Current Status

### ✅ Completed

- `logo-vibe.svg` - Wave-based "V" logo for Vibe Finance
- SVG source files in `src/themes/vibe/assets/`
- Dynamic manifest generation via `src/app/manifest.ts`
- Theme-aware favicon/icon configuration in layout.tsx

### ⏳ Pending

- Generate `favicon-vibe.ico`
- Generate `apple-touch-icon-vibe.png`
- Generate `og-image-vibe.png` (Open Graph social preview)
- Create default theme assets if switching to multi-theme deployment

## Quick Setup for Vibe Finance

For quick testing, you can temporarily use the existing default icons or create simple placeholders:

```bash
# Copy existing icons as placeholders (temporary)
cp public/icon.svg public/logo-vibe.svg  # Already exists
cp public/favicon.ico public/favicon-vibe.ico  # If exists
cp public/apple-touch-icon.png public/apple-touch-icon-vibe.png  # If exists
```

Then generate proper branded icons using one of the methods above.

## Notes

- PWA icons (`icon-192x192.png`, `icon-512x512.png`) are shared across themes currently
- For production, generate unique icons for each theme with proper branding
- Favicon should match the theme's primary color scheme
- Test icons on different devices (iOS, Android, Desktop) to ensure proper rendering
