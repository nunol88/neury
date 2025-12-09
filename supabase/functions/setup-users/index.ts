import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];

    // Create admin user (Mayara)
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'mayara@admin.com',
      password: 'admin',
      email_confirm: true,
      user_metadata: { name: 'Mayara' }
    });

    if (adminError) {
      results.push({ user: 'Mayara (admin)', error: adminError.message });
    } else if (adminUser.user) {
      // Assign admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: adminUser.user.id, role: 'admin' });
      
      results.push({ 
        user: 'Mayara (admin)', 
        email: 'mayara@admin.com',
        success: !roleError,
        error: roleError?.message 
      });
    }

    // Create neury user
    const { data: neuryUser, error: neuryError } = await supabase.auth.admin.createUser({
      email: 'neury@neury.com',
      password: 'ainain',
      email_confirm: true,
      user_metadata: { name: 'Neury' }
    });

    if (neuryError) {
      results.push({ user: 'Neury', error: neuryError.message });
    } else if (neuryUser.user) {
      // Assign neury role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: neuryUser.user.id, role: 'neury' });
      
      results.push({ 
        user: 'Neury', 
        email: 'neury@neury.com',
        success: !roleError,
        error: roleError?.message 
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
