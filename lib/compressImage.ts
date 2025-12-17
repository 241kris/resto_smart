import sharp from 'sharp'

/**
 * Compresse une image base64 et réduit son poids d'au moins 60%
 * @param base64Image - Image en format base64 (data:image/...;base64,...)
 * @param quality - Qualité de compression (0-100), par défaut 40 pour réduire ~60%
 * @returns Image compressée en base64
 */
export async function compressImage(base64Image: string, quality: number = 40): Promise<string> {
  try {
    // Extraire le type MIME et les données base64
    const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Format base64 invalide')
    }

    const imageType = matches[1]
    const base64Data = matches[2]

    // Convertir base64 en Buffer
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Déterminer le format de sortie (on garde webp pour une meilleure compression)
    let compressedBuffer: Buffer

    // Compresser l'image avec sharp
    const sharpInstance = sharp(imageBuffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })

    // Utiliser WebP pour une compression optimale
    compressedBuffer = await sharpInstance
      .webp({ quality, effort: 6 }) // effort: 6 pour un bon équilibre qualité/vitesse
      .toBuffer()

    // Convertir le buffer compressé en base64
    const compressedBase64 = compressedBuffer.toString('base64')

    // Calculer les taux de compression
    const originalSize = imageBuffer.length
    const compressedSize = compressedBuffer.length
    const compressionRate = ((originalSize - compressedSize) / originalSize * 100).toFixed(2)

    console.log(`Image compressée: ${originalSize} bytes → ${compressedSize} bytes (${compressionRate}% de réduction)`)

    // Retourner en format base64 avec le bon préfixe WebP
    return `data:image/webp;base64,${compressedBase64}`
  } catch (error) {
    console.error('Erreur lors de la compression de l\'image:', error)
    throw new Error('Impossible de compresser l\'image')
  }
}

/**
 * Compresse plusieurs images en parallèle
 * @param base64Images - Array d'images en base64
 * @param quality - Qualité de compression (0-100)
 * @returns Array d'images compressées en base64
 */
export async function compressImages(base64Images: string[], quality: number = 40): Promise<string[]> {
  return Promise.all(base64Images.map(image => compressImage(image, quality)))
}
