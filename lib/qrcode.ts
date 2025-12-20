import QRCode from 'qrcode';
import sharp from 'sharp';

/**
 * Génère un QR Code avec le numéro de la table écrit au centre
 * @param url - L'URL à encoder dans le QR Code
 * @param tableIdentifier - Le numéro ou le nom de la table (ex: 7, "12", "T-5")
 * @returns Promise<string> - L'image du QR Code en base64
 */
export async function generateQRCode(url: string, tableIdentifier: number | string): Promise<string> {
  try {
    const width = 300;
    
    // 1. Générer le QR Code de base en Buffer
    // errorCorrectionLevel: 'H' est CRITIQUE pour permettre de masquer le centre sans corrompre le code
    const qrBuffer = await QRCode.toBuffer(url, {
      width: width,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' 
    });

    // 2. Créer une image SVG contenant le numéro
    // Un carré blanc avec coins arrondis + le texte centré
    const textOverlay = `
      <svg width="80" height="80" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="80" height="80" rx="10" ry="10" fill="white" />
        <text 
          x="50%" 
          y="50%" 
          text-anchor="middle" 
          dominant-baseline="central" 
          font-family="Arial, sans-serif" 
          font-weight="800" 
          font-size="28" 
          fill="black"
        >
          ${tableIdentifier}
        </text>
      </svg>
    `;

    // 3. Fusionner le QR Code et le Texte SVG avec Sharp
    const finalImageBuffer = await sharp(qrBuffer)
      .composite([{
        input: Buffer.from(textOverlay),
        gravity: 'center' // Place l'image pile au milieu
      }])
      .toBuffer();

    // 4. Retourner en Base64
    return `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

  } catch (error) {
    console.error('Erreur lors de la génération du QR Code:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}