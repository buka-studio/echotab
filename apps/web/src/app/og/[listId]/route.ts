import { getPublicList } from "@echotab/lists/ListService";
import * as validators from "@echotab/lists/validators";
import { NoResultError } from "kysely";

import { createListOGImageResponse } from "../../api/lists/util";

interface Context {
  params: Promise<{ listId: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: Context) {
  const { listId } = await context.params;

  const { error } = validators.listId.safeParse(listId);
  if (error) {
    return new Response("Invalid listId format", { status: 400 });
  }

  try {
    const list = await getPublicList(listId);

    return createListOGImageResponse({
      ...list,
      linkCount: list.links.length,
      linkTitles: list.links.slice(0, 3).map((link) => link.title?.trim() || link.url),
    });
  } catch (e) {
    if (e instanceof NoResultError) {
      return new Response("List not found", { status: 404 });
    }

    console.error(e);
    return new Response("Internal server error", { status: 500 });
  }
}
