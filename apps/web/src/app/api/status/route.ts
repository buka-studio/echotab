import createSupabaseClient from "@echotab/supabase/client";

export async function GET(req: Request) {
  const start = performance.now();
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("lists").select("*").limit(1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const end = performance.now();
  const duration = end - start;

  return Response.json({
    database: {
      duration,
    },
  });
}
