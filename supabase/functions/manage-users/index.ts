import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: callerRole } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (callerRole?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { email, password, role, name } = payload;

      if (!email || !password || !role) {
        return new Response(JSON.stringify({ error: "Email, password e role são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["admin", "neury"].includes(role)) {
        return new Response(JSON.stringify({ error: "Role inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user via admin API
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || email.split("@")[0] },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign role
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role, is_active: true });

      if (roleError) {
        return new Response(JSON.stringify({ error: roleError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent deleting self
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Não pode eliminar a si próprio" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete role first
      await adminClient.from("user_roles").delete().eq("user_id", user_id);

      // Delete auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);

      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      // List all auth users with their roles
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: roles } = await adminClient.from("user_roles").select("*");

      const result = users.map((u) => {
        const userRole = roles?.find((r) => r.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.name || u.email?.split("@")[0] || "",
          role: userRole?.role || null,
          is_active: userRole?.is_active ?? true,
          role_id: userRole?.id || null,
          created_at: u.created_at,
        };
      });

      return new Response(JSON.stringify({ users: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
