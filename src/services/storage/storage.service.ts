import { supabase } from "../../config/supabase";

export class StorageService {
  static async upload(
    buffer: Buffer,
    path: string,
    contentType: string
  ) {
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return path;
  }

  static async delete(path: string) {
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .remove([path]);

    if (error) {
      throw error;
    }
  }

  static async getSignedUrl(
    path: string,
    expiresIn = 3600
  ) {
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }
}