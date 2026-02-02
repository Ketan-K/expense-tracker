# Vibe Finance Brand Assets

## Created Assets

- ✅ logo-vibe.svg - Main logo with purple-pink gradient wave V design

## Assets to Generate (Post-Implementation)

### Required for Production:

1. **favicon-vibe.ico** (Multi-resolution)
   - 16x16, 32x32, 48x48 sizes
   - Use the wave V logo, simplified for small sizes
   - Purple-pink gradient background

2. **apple-touch-icon-vibe.png** (180x180)
   - High-quality PNG with padding (minimum 20px from edges)
   - Wave V logo centered on gradient background
   - Purple (#8B5CF6) to Pink (#EC4899) gradient

3. **og-image-vibe.png** (1200x630)
   - Social media preview image
   - Include: Logo, "Vibe Finance" text, tagline "Money Moves Only 💸"
   - Purple-pink gradient background
   - Modern, clean typography (Space Grotesk font)

## Generation Instructions:

You can generate these using:

- Image editing tools (Figma, Photoshop, GIMP)
- Online favicon generators
- CLI tools like ImageMagick or sharp

### Example commands (if using ImageMagick):

```bash
# Convert SVG to PNG (for apple-touch-icon)
convert -background none logo-vibe.svg -resize 180x180 apple-touch-icon-vibe.png

# Create favicon (requires PNG source)
convert apple-touch-icon-vibe.png -resize 32x32 favicon-vibe.ico
```

### Temporary Solution:

For development/testing, you can:

1. Copy existing assets and rename them
2. Use placeholder images
3. Generate using online tools like https://realfavicongenerator.net/

The app will work without these assets, but will fallback to default theme assets.
