import QRCode from 'qrcode';
import sharp from 'sharp';

export async function generateQRCode(url: string, tableIdentifier?: number | string, showOverlay: boolean = true): Promise<string> {
  try {
    const width = 400;
    const identifier = tableIdentifier ? String(tableIdentifier) : '';

    // 1. Générer le QR Code avec correction d'erreur selon le besoin
    const qrBuffer = await QRCode.toBuffer(url, {
      width: width,
      margin: 2,
      errorCorrectionLevel: showOverlay ? 'H' : 'M', // H si overlay (permet obscurcir 30%), M sinon
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Si pas d'overlay demandé, retourner directement le QR code
    if (!showOverlay || !identifier) {
      return `data:image/png;base64,${qrBuffer.toString('base64')}`;
    }

    // 2. Calculer la taille de police dynamiquement selon la longueur
    let fontSize = 36;
    let overlaySize = 120;

    if (identifier.length > 4) {
      fontSize = 28;
      overlaySize = 110;
    }
    if (identifier.length > 6) {
      fontSize = 24;
      overlaySize = 100;
    }
    if (identifier.length > 8) {
      fontSize = 20;
      overlaySize = 90;
    }

    // 3. Créer l'overlay simplifié et compatible production
    // Utilise un SVG sans filtres complexes pour une meilleure compatibilité
    const textOverlay = Buffer.from(`
      <svg width="${overlaySize}" height="${overlaySize}" xmlns="http://www.w3.org/2000/svg">
        <!-- Cercle de fond blanc -->
        <circle
          cx="${overlaySize / 2}"
          cy="${overlaySize / 2}"
          r="${overlaySize / 2 - 4}"
          fill="#FFFFFF"
        />

        <!-- Bordure orange -->
        <circle
          cx="${overlaySize / 2}"
          cy="${overlaySize / 2}"
          r="${overlaySize / 2 - 4}"
          fill="none"
          stroke="#F97316"
          stroke-width="3"
        />

        <!-- Contour blanc pour le texte (meilleure lisibilité) -->
        <text
          x="${overlaySize / 2}"
          y="${overlaySize / 2}"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="bold"
          font-size="${fontSize}"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          stroke-width="5"
        >${identifier}</text>

        <!-- Texte principal orange -->
        <text
          x="${overlaySize / 2}"
          y="${overlaySize / 2}"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="bold"
          font-size="${fontSize}"
          fill="#F97316"
        >${identifier}</text>
      </svg>
    `);

    // 4. Fusionner le QR code avec l'overlay au centre
    const finalImageBuffer = await sharp(qrBuffer)
      .composite([{
        input: textOverlay,
        gravity: 'center'
      }])
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toBuffer();

    return `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

  } catch (error) {
    console.error('Erreur lors de la génération du QR Code:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('Identifier:', tableIdentifier);
    console.error('Show overlay:', showOverlay);

    // En cas d'erreur, retourner au moins le QR code sans overlay
    console.warn('Retour au QR code simple sans overlay à cause d\'une erreur');
    try {
      const simpleQrBuffer = await QRCode.toBuffer(url, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return `data:image/png;base64,${simpleQrBuffer.toString('base64')}`;
    } catch (fallbackError) {
      console.error('Erreur même avec QR simple:', fallbackError);
      throw new Error('Impossible de générer le QR Code');
    }
  }
}