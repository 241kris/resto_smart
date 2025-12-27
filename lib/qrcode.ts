import * as QRCode from 'qrcode';

export async function generateQRCode(url: string): Promise<string> {
  try {
    const width = 400;

    // Générer le QR Code simple sans overlay
    const qrBuffer = await QRCode.toBuffer(url, {
      width: width,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return `data:image/png;base64,${qrBuffer.toString('base64')}`;

  } catch (error) {
    console.error('Erreur lors de la génération du QR Code:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}
