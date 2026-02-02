/**
 * Generate theme-specific icons and favicons
 * 
 * This script generates all required icon assets for PWA and branding:
 * - favicon.ico (multi-size)
 * - apple-touch-icon.png (180x180)
 * - og-image.png (1200x630)
 * - PWA icons (192x192, 512x512)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import pngToIco from 'png-to-ico';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THEME = process.argv[2] || 'vibe';
const SOURCE_LOGO = path.join(__dirname, '../public/logo-vibe.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

// Icon configurations
const ICONS = [
  // Favicon sizes (will be combined into .ico)
  { name: 'favicon-16', size: 16, format: 'png' },
  { name: 'favicon-32', size: 32, format: 'png' },
  { name: 'favicon-48', size: 48, format: 'png' },
  
  // Apple touch icon
  { name: `apple-touch-icon-${THEME}`, size: 180, format: 'png' },
  
  // PWA icons
  { name: `icon-192x192-${THEME}`, size: 192, format: 'png' },
  { name: `icon-512x512-${THEME}`, size: 512, format: 'png' },
];

async function generateIcons() {
  console.log(`🎨 Generating icons for theme: ${THEME}`);
  console.log(`📂 Source: ${SOURCE_LOGO}`);
  console.log(`📂 Output: ${OUTPUT_DIR}\n`);

  // Check if source exists
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`❌ Source logo not found: ${SOURCE_LOGO}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const faviconPngs = [];

  // Generate all PNG icons
  for (const icon of ICONS) {
    const outputPath = path.join(OUTPUT_DIR, `${icon.name}.${icon.format}`);
    
    try {
      await sharp(SOURCE_LOGO)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${icon.name}.${icon.format} (${icon.size}x${icon.size})`);
      
      // Collect favicon PNGs for ICO conversion
      if (icon.name.startsWith('favicon-')) {
        faviconPngs.push({
          path: outputPath,
          size: icon.size
        });
      }
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}.${icon.format}:`, error.message);
    }
  }

  // Generate multi-resolution .ico file
  const faviconIcoPath = path.join(OUTPUT_DIR, `favicon-${THEME}.ico`);
  
  try {
    // Create temporary PNG files for ICO generation (recreate them)
    const tempPngs = [];
    for (const png of faviconPngs) {
      const tempPath = path.join(OUTPUT_DIR, `temp-${png.size}.png`);
      await sharp(SOURCE_LOGO)
        .resize(png.size, png.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(tempPath);
      tempPngs.push(tempPath);
    }
    
    // Convert PNGs to ICO
    const icoBuffer = await pngToIco(tempPngs);
    fs.writeFileSync(faviconIcoPath, icoBuffer);
    console.log(`\n✅ Generated: favicon-${THEME}.ico (multi-resolution: 16x16, 32x32, 48x48)`);
    
    // Clean up temp PNG files
    tempPngs.forEach(tempPath => {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    });
  } catch (error) {
    console.error(`❌ Failed to generate .ico file:`, error.message);
  }

  // Generate OG Image (1200x630 with branding)
  await generateOGImage();

  console.log(`\n✨ Icon generation complete!`);
}

async function generateOGImage() {
  const ogPath = path.join(OUTPUT_DIR, `og-image-${THEME}.png`);
  
  try {
    // Create a branded OG image with logo and gradient background
    const logoBuffer = await sharp(SOURCE_LOGO)
      .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Create gradient background (purple to pink for Vibe theme)
    const gradientSvg = `
      <svg width="1200" height="630">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#A78BFA;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)" />
        <text x="600" y="520" font-family="Arial, sans-serif" font-size="64" font-weight="bold" 
              fill="white" text-anchor="middle">Vibe Finance</text>
        <text x="600" y="580" font-family="Arial, sans-serif" font-size="32" 
              fill="rgba(255,255,255,0.9)" text-anchor="middle">Money Moves Only 💸</text>
      </svg>
    `;

    await sharp(Buffer.from(gradientSvg))
      .composite([
        {
          input: logoBuffer,
          top: 80,
          left: 400
        }
      ])
      .png()
      .toFile(ogPath);

    console.log(`✅ Generated: og-image-${THEME}.png (1200x630)`);
  } catch (error) {
    console.error(`❌ Failed to generate OG image:`, error.message);
  }
}

// Run the generator
generateIcons().catch(error => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});
