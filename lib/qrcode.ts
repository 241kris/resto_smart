import QRCode from 'qrcode';

export async function generateQRCode(url: string, tableIdentifier: number | string): Promise<string> {
  try {
    // Générer un QR Code simple sans overlay
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrDataUrl;

  } catch (error) {
    console.error('Erreur lors de la génération du QR Code:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}