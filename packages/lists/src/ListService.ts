import connection, { sql } from "@echotab/db/connection";
import { z } from "zod";

import { ForbiddenError } from "./errors";
import { PublicListView, UserList } from "./models";
import * as validators from "./validators";

type List = z.infer<typeof validators.list>;

export async function createList(userId: string, list: List): Promise<UserList> {
  const { links, ...listData } = list;

  const result = await connection.transaction().execute(async (trx) => {
    const { count } = await trx
      .selectFrom("lists")
      .select(({ fn }) => fn.count("id").as("count"))
      .where("ownerId", "=", userId)
      .executeTakeFirstOrThrow();

    if (Number(count) >= 10) {
      throw new ForbiddenError("User has reached the maximum number of lists");
    }

    const { id: listId, ...listResult } = await trx
      .insertInto("lists")
      .values({
        ownerId: userId,
        ...listData,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const linksResult = await trx.insertInto("links").values(links).returning("id").execute();

    await trx
      .insertInto("lists_links")
      .values(linksResult.map((link) => ({ listId, linkId: link.id })))
      .execute();

    return listResult;
  });

  return result;
}

export async function updateList(
  userId: string,
  listLocalId: string,
  list: List,
): Promise<UserList> {
  const { links, ...listData } = list;

  const result = await connection.transaction().execute(async (trx) => {
    await trx
      .selectFrom("lists")
      .where("ownerId", "=", userId)
      .where("localId", "=", listLocalId)
      .executeTakeFirstOrThrow();

    const { id: listId, ...listResult } = await trx
      .updateTable("lists")
      .set(listData)
      .where("ownerId", "=", userId)
      .where("localId", "=", listLocalId)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (links?.length) {
      const linksToDelete = await trx
        .deleteFrom("lists_links")
        .where("listId", "=", listId)
        .returning("linkId")
        .execute();

      if (linksToDelete.length) {
        await trx
          .deleteFrom("links")
          .where(
            "id",
            "in",
            linksToDelete.map((link) => link.linkId),
          )
          .execute();
      }

      const linksResult = await trx.insertInto("links").values(links).returning("id").execute();

      await trx
        .insertInto("lists_links")
        .values(linksResult.map((link) => ({ listId, linkId: link.id })))
        .execute();
    }

    return listResult;
  });

  return result!;
}

export async function incrementViewCount(listId: string) {
  return sql`
    update lists
    set "viewCount" = "viewCount" + 1
    where "publicId" = ${listId}
  `.execute(connection);
}

export async function incrementImportCount(listId: string) {
  return sql`
    update lists
    set "importCount" = "importCount" + 1
    where "publicId" = ${listId}
  `.execute(connection);
}

export async function getUserLists(userId: string): Promise<UserList[]> {
  const lists = await connection
    .selectFrom("lists")
    .selectAll()
    .where("ownerId", "=", userId)
    .execute();

  return lists;
}

export async function unpublishUserLists(userId: string) {
  return connection
    .updateTable("lists")
    .set({ published: false })
    .where("ownerId", "=", userId)
    .execute();
}

export async function getPublicList(publicId: string): Promise<PublicListView> {
  const list = await connection
    .selectFrom("lists")
    .selectAll()
    .where("publicId", "=", publicId)
    .where("published", "=", true)
    .executeTakeFirstOrThrow();

  const links = await connection
    .selectFrom("links as l")
    .leftJoin("lists_links as ll", "ll.linkId", "l.id")
    .where("ll.listId", "=", list.id)
    .selectAll()
    .execute();

  const { id, ownerId, localId, ...listData } = list;

  return {
    ...listData,
    links: links.map(({ title, url, localId }) => ({ title, url, localId })),
  };
}
