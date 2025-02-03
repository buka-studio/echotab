import { incrementViewCount } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";

interface Context {
  params: { listId: string };
}

export async function POST(req: Request, context: Context) {
  const listId = context.params.listId;

  const { error } = validators.userId.safeParse(listId);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  try {
    await incrementViewCount(listId as string);
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
