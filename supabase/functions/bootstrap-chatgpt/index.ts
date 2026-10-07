import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async () => {
  const a = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const email = "chatgpt@mayslimpo.app";
  const { data: list } = await a.auth.admin.listUsers({ perPage: 1000 });
  let u = list?.users.find((x) => x.email === email);
  if (u) {
    const { error } = await a.auth.admin.updateUserById(u.id, { password: "GPTmayara", email_confirm: true });
    if (error) return new Response(error.message, { status: 500 });
  } else {
    const r = await a.auth.admin.createUser({ email, password: "GPTmayara", email_confirm: true });
    if (r.error) return new Response(r.error.message, { status: 500 });
    u = r.data.user!;
  }
  await a.from("user_roles").upsert({ user_id: u.id, role: "admin" }, { onConflict: "user_id,role" });
  return new Response("ok " + u.id);
});
