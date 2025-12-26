import QRCode from 'qrcode';
import sharp from 'sharp';

export async function generateQRCode(url: string, tableIdentifier: number | string): Promise<string> {
  try {
    const width = 400;
    const identifier = String(tableIdentifier);

    // 1. Générer le QR Code
    const qrBuffer = await QRCode.toBuffer(url, {
      width,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    // 2. Déterminer la taille du texte
    let fontSize = 36;
    let overlaySize = 120;
    if (identifier.length > 4) { fontSize = 28; overlaySize = 110; }
    if (identifier.length > 6) { fontSize = 24; overlaySize = 100; }
    if (identifier.length > 8) { fontSize = 20; overlaySize = 90; }

    // 3. SVG simple avec police sans-serif sûre
    const textOverlay = Buffer.from(`
<svg width="${overlaySize}" height="${overlaySize}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${overlaySize/2}" cy="${overlaySize/2}" r="${overlaySize/2 - 4}" fill="#ffffff"/>
  <text
    x="${overlaySize/2}"
    y="${overlaySize/2}"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#F97316"
  >${identifier}</text>
</svg>
`);

    // 4. Fusionner QR et overlay
    const finalImageBuffer = await sharp(qrBuffer)
      .composite([{ input: textOverlay, gravity: 'center' }])
      .png()
      .toBuffer();

    return `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

  } catch (error) {
    console.error('Erreur génération QR:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}
