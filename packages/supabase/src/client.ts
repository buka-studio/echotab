import * as supabase from "@supabase/supabase-js";

export default function createSupabaseClient() {
  return supabase.createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
