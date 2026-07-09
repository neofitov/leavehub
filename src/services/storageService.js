// Supabase Storage access for avatars (public bucket) and leave-request
// attachments (private bucket). Files live under "<user_id>/..." so the storage
// RLS policies can scope access to the owner.

import { supabase } from '../supabase/client.js';

function extOf(filename) {
  const dot = filename.lastIndexOf('.');
  return dot > -1 ? filename.slice(dot + 1).toLowerCase() : 'bin';
}

/** Upload/replace a user's avatar; returns a public URL. */
export async function uploadAvatar(userId, file) {
  const path = `${userId}/avatar.${extOf(file.name)}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so the <img> refreshes after replacing the file.
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Upload a leave-request attachment; returns the storage path to persist. */
export async function uploadAttachment(userId, file) {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/** Create a short-lived signed URL to download a private attachment. */
export async function getAttachmentUrl(path, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
