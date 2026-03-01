import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;
const VALID_ROLES = ["admin", "neury"];

function sanitizeErrorMessage(error: { message?: string }): string {
  const msg = error?.message || "";
  
  if (msg.includes("duplicate") || msg.includes("already exists") || msg.includes("already been registered")) {
    return "Este email já está registado";
  }
  if (msg.includes("password")) {
    return "Password não cumpre os requisitos de segurança";
  }
  if (msg.includes("not found") || msg.includes("User not found")) {
    return "Utilizador não encontrado";
  }
  
  return "Ocorreu um erro ao processar o pedido";
}

function makeErrorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
      return makeErrorResponse("Não autorizado", 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return makeErrorResponse("Não autorizado", 401);
    }

    // Check admin role
    const { data: callerRole } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (callerRole?.role !== "admin") {
      return makeErrorResponse("Apenas administradores", 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { email, password, role, name } = payload;

      if (!email || !password || !role) {
        return makeErrorResponse("Email, password e role são obrigatórios", 400);
      }

      // Validate email format
      if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return makeErrorResponse("Formato de email inválido", 400);
      }

      // Validate password strength
      if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
        return makeErrorResponse(`Password deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
      }

      // Validate role
      if (!VALID_ROLES.includes(role)) {
        return makeErrorResponse("Role inválido", 400);
      }

      // Sanitize name
      const sanitizedName = (typeof name === "string" ? name.trim().slice(0, MAX_NAME_LENGTH) : "") || email.split("@")[0];

      // Create user via admin API
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: { name: sanitizedName },
      });

      if (createError) {
        console.error("User creation failed:", createError);
        return makeErrorResponse(sanitizeErrorMessage(createError), 400);
      }

      // Assign role
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role, is_active: true });

      if (roleError) {
        console.error("Role assignment failed:", roleError);
        return makeErrorResponse(sanitizeErrorMessage(roleError), 400);
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;

      if (!user_id || typeof user_id !== "string") {
        return makeErrorResponse("user_id é obrigatório", 400);
      }

      // Prevent deleting self
      if (user_id === caller.id) {
        return makeErrorResponse("Não pode eliminar a si próprio", 400);
      }

      // Delete role first
      await adminClient.from("user_roles").delete().eq("user_id", user_id);

      // Delete auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);

      if (deleteError) {
        console.error("User deletion failed:", deleteError);
        return makeErrorResponse(sanitizeErrorMessage(deleteError), 400);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) {
        console.error("User listing failed:", listError);
        return makeErrorResponse(sanitizeErrorMessage(listError), 400);
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

    return makeErrorResponse("Ação inválida", 400);
  } catch (err) {
    console.error("Unexpected error in manage-users:", err);
    return makeErrorResponse("Erro interno do servidor", 500);
  }
});
