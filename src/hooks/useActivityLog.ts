import { supabase } from '@/integrations/supabase/client';

export const logActivity = async (action: string, details?: Record<string, unknown>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_activity_logs').insert({
      user_id: user.id,
      action,
      details: details || {},
    } as any);
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
};
