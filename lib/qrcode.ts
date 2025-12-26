import QRCode from 'qrcode';
import sharp from 'sharp';
import { createCanvas, registerFont } from 'canvas';
import path from 'path';

export async function generateQRCode(url: string, tableIdentifier: number | string): Promise<string> {
  const width = 400;
  const identifier = String(tableIdentifier);

  // 1. QR code
  const qrBuffer = await QRCode.toBuffer(url, {
    width,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  // 2. Créer canvas pour le texte
  const overlaySize = 120;
  const canvas = createCanvas(overlaySize, overlaySize);
  const ctx = canvas.getContext('2d');

  // 3. Fond blanc circulaire
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(overlaySize/2, overlaySize/2, overlaySize/2 - 4, 0, Math.PI*2);
  ctx.fill();

  // 4. Texte
  ctx.fillStyle = '#F97316';
  ctx.font = `bold 36px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(identifier, overlaySize/2, overlaySize/2);

  // 5. Fusion avec Sharp
  const textBuffer = canvas.toBuffer();
  const finalBuffer = await sharp(qrBuffer)
    .composite([{ input: textBuffer, gravity: 'center' }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${finalBuffer.toString('base64')}`;
}
