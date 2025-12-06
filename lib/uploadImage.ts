import { supabase } from './supabase'

/**
 * Upload an image to Supabase Storage
 * @param file - File buffer or base64 string
 * @param bucket - Supabase bucket name (e.g., 'qr-codes', 'products', 'establishments')
 * @param fileName - Name for the file
 * @returns Public URL of the uploaded file
 */
export async function uploadImageToSupabase(
  file: Buffer | string,
  bucket: string,
  fileName: string
): Promise<string> {
  try {
    // Convert base64 to buffer if needed
    let fileBuffer: Buffer

    if (typeof file === 'string') {
      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
      fileBuffer = Buffer.from(base64Data, 'base64')
    } else {
      fileBuffer = file
    }

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) {
      console.error('Erreur upload Supabase:', error)
      throw new Error(`Erreur lors de l'upload: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Erreur uploadImageToSupabase:', error)
    throw error
  }
}

/**
 * Delete an image from Supabase Storage
 * @param bucket - Supabase bucket name
 * @param filePath - Path to the file in the bucket
 */
export async function deleteImageFromSupabase(
  bucket: string,
  filePath: string
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Erreur suppression Supabase:', error)
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }
  } catch (error) {
    console.error('Erreur deleteImageFromSupabase:', error)
    throw error
  }
}
