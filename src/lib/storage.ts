import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadRequestPhoto(
  file: File,
  requestId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `request-photos/${requestId}/${fileName}`;

  const { error, data } = await supabase.storage
    .from('request-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Грешка при качване на снимка: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('request-photos')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deleteRequestPhoto(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('request-photos')
    .remove([filePath]);

  if (error) {
    throw new Error(`Грешка при изтриване на снимка: ${error.message}`);
  }
}

export function getPhotoPath(publicUrl: string): string {
  // Extract the path from the public URL
  const url = new URL(publicUrl);
  return url.pathname.split('/').slice(4).join('/'); // Skip /storage/v1/object/public/request-photos/
}
