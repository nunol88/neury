import { supabase } from '@/integrations/supabase/client';

export const EMAIL_LOGIN_SETTING = 'email_login_enabled';
export const NEW_REGISTRATIONS_SETTING = 'new_registrations_enabled';

export type AppSettingKey =
  | typeof EMAIL_LOGIN_SETTING
  | typeof NEW_REGISTRATIONS_SETTING;

/**
 * Fetch a boolean app setting from the server.
 * Falls back to `false` (safer default) if the row is missing or fetch fails.
 */
export async function getBooleanSetting(key: AppSettingKey): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) {
      console.error(`Error reading setting ${key}:`, error.message);
      return false;
    }
    return data?.value === true;
  } catch (err) {
    console.error(`Error reading setting ${key}:`, err);
    return false;
  }
}

/**
 * Set a boolean app setting. Server-side RLS restricts this to admins.
 */
export async function setBooleanSetting(
  key: AppSettingKey,
  value: boolean
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' });
  return { error: error ? new Error(error.message) : null };
}
