// ---------------------------------------
//  Utilitaire de génération de QR Code
// ---------------------------------------

import QRCode from 'qrcode';

/**
 * Génère un QR Code en base64 à partir d'une URL
 * @param url - L'URL à encoder dans le QR Code
 * @returns Promise<string> - L'image du QR Code en base64
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    // Génère le QR Code en base64 (format data:image/png;base64,...)
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Erreur lors de la génération du QR Code:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}

/**
 * Génère un QR Code en buffer PNG
 * @param url - L'URL à encoder dans le QR Code
 * @returns Promise<Buffer> - L'image du QR Code en buffer
 */
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(url, {
      width: 300,
      margin: 2,
    });

    return buffer;
  } catch (error) {
    console.error('Erreur lors de la génération du QR Code:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}
