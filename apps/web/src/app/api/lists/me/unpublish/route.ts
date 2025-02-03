import { unpublishUserLists } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";

export async function POST(req: Request) {
  const userId = req.headers.get("X-EchoTab-userId");

  const { error } = validators.userId.safeParse(userId);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  try {
    await unpublishUserLists(userId!);
    return Response.json({});
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
