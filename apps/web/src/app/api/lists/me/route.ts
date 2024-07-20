import { getUserLists } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";

export async function GET(req: Request) {
  const userId = req.headers.get("X-EchoTab-userId");

  const { error } = validators.userId.safeParse(userId);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  try {
    const lists = await getUserLists(userId!);
    return Response.json({ lists });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
