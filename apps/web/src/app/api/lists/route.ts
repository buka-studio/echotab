import { createList } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";

import { safeUpsertListOGImage } from "./util";

export async function POST(req: Request) {
  const userId = req.headers.get("X-EchoTab-userId");

  const data = await req.json();

  const { error: dataError } = validators.list.safeParse(data);
  const { error: userIdError } = validators.userId.safeParse(userId);
  if (dataError || userIdError) {
    return Response.json({ error: (dataError || userIdError)!.message }, { status: 400 });
  }

  try {
    const list = await createList(userId!, data);

    safeUpsertListOGImage(userId!, { ...list, linkCount: data.links.length });

    return Response.json({ list }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
