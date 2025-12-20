import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Utilise le nouveau nom
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client standard (public)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client Admin (pour la suppression forcée)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Upload une image (QR Code)
 */
export async function uploadImageToSupabase(file: Buffer | string, bucket: string, fileName: string): Promise<string> {
  let fileBuffer: Buffer;
  if (typeof file === 'string') {
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    fileBuffer = Buffer.from(base64Data, 'base64');
  } else {
    fileBuffer = file;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileBuffer, { contentType: 'image/png', upsert: true });

  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}

/**
 * Supprime une image (utilise le client ADMIN)
 */
export async function deleteImageFromSupabase(bucket: string, fullUrl: string): Promise<void> {
  try {
    if (!fullUrl) return;

    // Extraction du chemin : on enlève tout ce qui est avant le nom du dossier dans l'URL
    const urlParts = fullUrl.split(`/public/${bucket}/`);
    const pathToDelete = urlParts.length > 1 ? decodeURIComponent(urlParts[1]) : fullUrl;

    console.log(`🗑️ Suppression Admin : ${pathToDelete}`);

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([pathToDelete]);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur suppression Supabase:', error);
  }
}