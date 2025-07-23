const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const optimizedDir = path.join(publicDir, 'optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Image optimization settings
const optimizationSettings = {
  quality: 85,
  format: 'webp',
  width: null, // Will maintain aspect ratio
  height: null
};

// Specific settings for different image types
const imageSettings = {
  'favicon.png': { width: 32, height: 32, quality: 90 },
  'favicon-96x96.png': { width: 96, height: 96, quality: 90 },
  'apple-touch-icon.png': { width: 180, height: 180, quality: 90 },
  'web-app-manifest-192x192.png': { width: 192, height: 192, quality: 90 },
  'web-app-manifest-512x512.png': { width: 512, height: 512, quality: 90 },
  'profile-placeholder.jpg': { width: 256, height: 256, quality: 85 }
};

async function optimizeImage(filename) {
  const inputPath = path.join(publicDir, filename);
  const outputPath = path.join(optimizedDir, filename.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
  
  // Skip if not an image file
  if (!/\.(png|jpg|jpeg)$/i.test(filename)) {
    return;
  }

  try {
    console.log(`Optimizing ${filename}...`);
    
    const settings = imageSettings[filename] || optimizationSettings;
    
    let sharpInstance = sharp(inputPath);
    
    // Resize if dimensions are specified
    if (settings.width && settings.height) {
      sharpInstance = sharpInstance.resize(settings.width, settings.height, {
        fit: 'cover',
        position: 'center'
      });
    }
    
    // Convert to WebP with specified quality
    await sharpInstance
      .webp({ quality: settings.quality })
      .toFile(outputPath);
    
    // Get file sizes for comparison
    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${filename}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
    
  } catch (error) {
    console.error(`❌ Error optimizing ${filename}:`, error.message);
  }
}

async function optimizeAllImages() {
  const files = fs.readdirSync(publicDir);
  const imageFiles = files.filter(file => /\.(png|jpg|jpeg)$/i.test(file));
  
  console.log(`Found ${imageFiles.length} images to optimize...\n`);
  
  for (const file of imageFiles) {
    await optimizeImage(file);
  }
  
  console.log('\n🎉 Image optimization complete!');
  console.log(`Optimized images saved to: ${optimizedDir}`);
}

optimizeAllImages().catch(console.error); 