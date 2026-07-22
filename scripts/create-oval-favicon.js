/**
 * Create Oval-Style Favicon Script
 * 
 * This script helps create a favicon with oval-like appearance similar to YouTube's style.
 * 
 * Requirements:
 * - Node.js installed
 * - sharp package: npm install sharp
 * 
 * Usage:
 * node scripts/create-oval-favicon.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error(`
❌ Error: 'sharp' package not found.

Please install it first:
  npm install sharp

Or use the manual method described in OVAL_FAVICON_GUIDE.md
  `);
  process.exit(1);
}

async function createOvalFavicon() {
  const publicDir = path.join(__dirname, '..', 'public');
  const logoPath = path.join(publicDir, 'logo-white.png');
  const faviconPath = path.join(publicDir, 'favicon.ico');

  // Check if logo exists
  if (!fs.existsSync(logoPath)) {
    console.error(`❌ Logo file not found: ${logoPath}`);
    console.log('Available logo files:');
    const files = fs.readdirSync(publicDir).filter(f => f.includes('logo') || f.includes('Logo'));
    files.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }

  console.log('🎨 Creating oval-style favicon...');
  console.log(`📁 Source: ${logoPath}`);

  try {
    // Read the logo
    const logo = sharp(logoPath);
    const metadata = await logo.metadata();
    
    console.log(`📐 Original logo: ${metadata.width}x${metadata.height}`);

    // Calculate dimensions for oval padding
    // For oval appearance, we want horizontal padding to be less than vertical
    // This creates the elongated oval shape
    const sizes = [16, 32, 48];
    const faviconImages = [];

    for (const size of sizes) {
      // Calculate padding: more vertical padding, less horizontal
      // This creates the oval-like silhouette
      const horizontalPadding = Math.floor(size * 0.15); // 15% horizontal padding
      const verticalPadding = Math.floor(size * 0.25);   // 25% vertical padding
      
      const contentWidth = size - (horizontalPadding * 2);
      const contentHeight = size - (verticalPadding * 2);

      // Resize logo to fit within the padded area, maintaining aspect ratio
      const logoAspectRatio = metadata.width / metadata.height;
      let logoWidth, logoHeight;

      if (logoAspectRatio > 1) {
        // Logo is wider than tall
        logoWidth = contentWidth;
        logoHeight = Math.floor(contentWidth / logoAspectRatio);
        if (logoHeight > contentHeight) {
          logoHeight = contentHeight;
          logoWidth = Math.floor(logoHeight * logoAspectRatio);
        }
      } else {
        // Logo is taller than wide
        logoHeight = contentHeight;
        logoWidth = Math.floor(logoHeight * logoAspectRatio);
        if (logoWidth > contentWidth) {
          logoWidth = contentWidth;
          logoHeight = Math.floor(logoWidth / logoAspectRatio);
        }
      }

      // Center the logo
      const leftOffset = Math.floor((size - logoWidth) / 2);
      const topOffset = Math.floor((size - logoHeight) / 2);

      // Create square canvas with transparent background
      const canvas = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
        }
      });

      // Resize logo
      const resizedLogo = await logo
        .clone()
        .resize(logoWidth, logoHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Composite logo onto canvas
      const faviconImage = await canvas
        .composite([{
          input: resizedLogo,
          left: leftOffset,
          top: topOffset
        }])
        .png()
        .toBuffer();

      faviconImages.push({ size, buffer: faviconImage });
      console.log(`✅ Created ${size}x${size} favicon`);
    }

    // For .ico format, we'll create a multi-size PNG and convert
    // Note: true .ico requires special format, so we'll use PNG for now
    // Most browsers accept PNG as favicon.ico
    
    // Save as PNG first (browsers accept this)
    const largestSize = faviconImages[faviconImages.length - 1];
    fs.writeFileSync(faviconPath.replace('.ico', '.png'), largestSize.buffer);
    
    // Also save the 32x32 as favicon.ico (browsers will use it)
    const mediumSize = faviconImages.find(img => img.size === 32);
    fs.writeFileSync(faviconPath, mediumSize.buffer);

    console.log(`\n✅ Favicon created successfully!`);
    console.log(`📁 Location: ${faviconPath}`);
    console.log(`\n💡 Note: The file is saved as PNG format but named .ico`);
    console.log(`   Modern browsers will accept this. For true .ico format,`);
    console.log(`   use an online converter or ImageMagick.`);
    console.log(`\n🔄 Next steps:`);
    console.log(`   1. Hard refresh your browser (Ctrl+Shift+R)`);
    console.log(`   2. Check that /favicon.ico is accessible`);
    console.log(`   3. Verify it appears in browser tabs`);

  } catch (error) {
    console.error('❌ Error creating favicon:', error);
    process.exit(1);
  }
}

// Run the script
createOvalFavicon();










