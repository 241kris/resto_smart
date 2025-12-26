import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';

export async function generateQRCode(url: string, tableIdentifier: number | string): Promise<string> {
  try {
    const size = 400; // taille du QR code
    const identifier = String(tableIdentifier);

    // 1️⃣ Générer le QR code en DataURL
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    const qrImage = await loadImage(qrDataUrl);

    // 2️⃣ Créer un canvas final
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 3️⃣ Dessiner le QR code
    ctx.drawImage(qrImage, 0, 0, size, size);

    // 4️⃣ Déterminer taille du cercle et du texte selon longueur du numéro
    let overlaySize = 120;
    let fontSize = 36;
    if (identifier.length > 4) { overlaySize = 110; fontSize = 28; }
    if (identifier.length > 6) { overlaySize = 100; fontSize = 24; }
    if (identifier.length > 8) { overlaySize = 90; fontSize = 20; }

    const centerX = size / 2;
    const centerY = size / 2;

    // 5️⃣ Dessiner le cercle blanc avec bordure et légère ombre
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, overlaySize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#F97316';
    ctx.stroke();
    ctx.restore();

    // 6️⃣ Dessiner le texte centré
    ctx.fillStyle = '#F97316';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(identifier, centerX, centerY);

    // 7️⃣ Retourner l’image finale en base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erreur génération QR:', error);
    throw new Error('Impossible de générer le QR Code');
  }
}
