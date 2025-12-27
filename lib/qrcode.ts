import * as QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';

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

    // 2. Charger l'image QR dans un canvas
    const qrImage = await loadImage(qrBuffer);
    const canvas = createCanvas(width, width);
    const ctx = canvas.getContext('2d');

    // 3. Dessiner le QR code
    ctx.drawImage(qrImage, 0, 0, width, width);

    // 4. Calculer la taille de police dynamiquement selon la longueur
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

    // 5. Calculer le centre et le rayon
    const centerX = width / 2;
    const centerY = width / 2;
    const radius = overlaySize / 2 - 4;

    // 6. Dessiner le cercle de fond blanc avec ombre
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // 7. Dessiner la bordure orange
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 8. Dessiner le texte
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;

    // Contour blanc pour meilleure lisibilité
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeText(identifier, centerX, centerY);

    // Texte principal orange
    ctx.fillStyle = '#F97316';
    ctx.fillText(identifier, centerX, centerY);

    // 9. Convertir en base64
    const finalImageBase64 = canvas.toDataURL('image/png');
    return finalImageBase64;

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
