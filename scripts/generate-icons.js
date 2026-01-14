const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 256, 384, 512];
const inputFile = path.join(__dirname, '../public/logo.png');

async function generateIcons() {
  console.log('Génération des icônes PWA...');

  for (const size of sizes) {
    const outputFile = path.join(__dirname, `../public/icon-${size}x${size}.png`);

    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputFile);

      console.log(`✓ Icône ${size}x${size} générée`);
    } catch (error) {
      console.error(`✗ Erreur pour l'icône ${size}x${size}:`, error.message);
    }
  }

  console.log('Génération terminée!');
}

generateIcons();
