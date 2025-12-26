import QRCode from 'qrcode';
import sharp from 'sharp';

export async function generateQRCode(url: string, tableIdentifier: number | string): Promise<string> {
  try {
    const width = 400;
    const identifier = String(tableIdentifier);

    // 1. Générer le QR Code avec correction d'erreur haute (permet d'obscurcir jusqu'à 30% du code)
    const qrBuffer = await QRCode.toBuffer(url, {
      width: width,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

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

    // 3. Créer l'overlay élégant avec fond blanc, ombre et bordure
    const textOverlay = Buffer.from(`
      <svg width="${overlaySize}" height="${overlaySize}" xmlns="http://www.w3.org/2000/svg">
        <!-- Dégradé subtil pour le fond -->
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(250,250,250);stop-opacity:1" />
          </linearGradient>
          <!-- Filtre pour l'ombre portée -->
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Cercle de fond avec ombre -->
        <circle
          cx="${overlaySize / 2}"
          cy="${overlaySize / 2}"
          r="${overlaySize / 2 - 4}"
          fill="url(#grad1)"
          filter="url(#shadow)"
        />

        <!-- Bordure du cercle -->
        <circle
          cx="${overlaySize / 2}"
          cy="${overlaySize / 2}"
          r="${overlaySize / 2 - 4}"
          fill="none"
          stroke="#F97316"
          stroke-width="3"
        />

        <!-- Texte principal avec effet -->
        <text
          x="${overlaySize / 2}"
          y="${overlaySize / 2 + 2}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="bold"
          font-size="${fontSize}"
          fill="#1a1a1a"
          style="paint-order: stroke; stroke: #ffffff; stroke-width: 4px; stroke-linecap: round; stroke-linejoin: round;"
        >
          ${identifier}
        </text>
        <text
          x="${overlaySize / 2}"
          y="${overlaySize / 2 + 2}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="bold"
          font-size="${fontSize}"
          fill="#F97316"
        >
          ${identifier}
        </text>
      </svg>
    `);

    // 4. Fusionner le QR code avec l'overlay au centre
    const finalImageBuffer = await sharp(qrBuffer)
      .composite([{
        input: textOverlay,
        gravity: 'center'
      }])
      .png()
      .toBuffer();

    return `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

  } catch (error) {
    console.error('Erreur lors de la génération du QR Code:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}