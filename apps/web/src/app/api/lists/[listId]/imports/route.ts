import { incrementImportCount } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";

interface Context {
  params: Promise<{ listId: string }>;
}

export async function POST(req: Request, context: Context) {
  const { listId } = await context.params;

  const { error } = validators.userId.safeParse(listId);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  try {
    await incrementImportCount(listId as string);
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
