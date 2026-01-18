import { getPublicList, updateList } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";
import { List } from "@echotab/lists/validators";
import { NoResultError } from "kysely";

import { safeUpsertListOGImage } from "../util";

interface Context {
  params: Promise<{ listId: string }>;
}

export async function GET(req: Request, context: Context) {
  const { listId } = await context.params;

  const { error } = validators.listId.safeParse(listId);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  try {
    const list = await getPublicList(listId as string);
    return Response.json({ list });
  } catch (e) {
    if (e instanceof NoResultError) {
      return Response.json({ error: "List not found" }, { status: 404 });
    }
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: Context) {
  const userId = req.headers.get("X-EchoTab-userId");

  const { listId } = await context.params;

  const { error } = validators.listId.safeParse(listId);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const data = await req.json();
  const { data: parsedData, error: dataError } = validators.list.partial().safeParse(data);
  const { error: userIdError } = validators.userId.safeParse(userId);
  if (dataError || userIdError) {
    return Response.json({ error: (dataError || userIdError)!.message }, { status: 400 });
  }

  try {
    const list = await updateList(userId!, listId, parsedData as List);
    if (parsedData?.published) {
      safeUpsertListOGImage(userId!, { ...list, linkCount: (parsedData.links || []).length });
    }

    return Response.json({ list });
  } catch (e) {
    if (e instanceof NoResultError) {
      return Response.json({ error: "List not found" }, { status: 404 });
    }
    console.error(e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
