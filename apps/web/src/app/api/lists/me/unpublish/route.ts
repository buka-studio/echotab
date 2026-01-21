import { unpublishUserLists } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";

export async function POST(req: Request) {
  const userId = req.headers.get("X-EchoTab-userId");

  if (!userId) {
    return Response.json({ error: "Missing required header: X-EchoTab-userId" }, { status: 401 });
  }

  const { error } = validators.userId.safeParse(userId);
  if (error) {
    return Response.json({ error: "Invalid userId format" }, { status: 400 });
  }

  try {
    await unpublishUserLists(userId);
    return Response.json({});
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
