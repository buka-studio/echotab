import { PublicListView, UserList } from "@echotab/lists/models";
import * as validators from "@echotab/lists/validators";
import { z } from "zod";

import { getApiURL } from "./util";

async function getUserId() {
  return chrome.storage.local.get("userId").then(({ userId }) => userId);
}

export async function getPublicList(publicId: string): Promise<PublicListView> {
  return fetch(getApiURL(`/lists/${publicId}`))
    .then((res) => res.json())
    .then(({ list }) => list);
}

export async function getLists(): Promise<UserList[]> {
  const userId = await getUserId();
  return fetch(getApiURL("/lists/me"), {
    headers: {
      "X-EchoTab-userId": userId,
    },
  })
    .then((res) => res.json())
    .then(({ lists }) => lists);
}

export async function unpublishLists() {
  const userId = await getUserId();
  return fetch(getApiURL("/lists/me/unpublish"), {
    method: "POST",
    headers: {
      "X-EchoTab-userId": userId,
    },
  });
}

const partialList = validators.list.partial();

export async function updateList(
  listLocalId: string,
  list: z.infer<typeof partialList>,
): Promise<UserList> {
  const userId = await getUserId();
  return fetch(getApiURL(`/lists/${listLocalId}`), {
    method: "PATCH",
    body: JSON.stringify(list),
    headers: {
      "X-EchoTab-userId": userId,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then(({ list }) => list);
}

export async function publishList(list: z.infer<typeof validators.list>): Promise<UserList> {
  const userId = await getUserId();
  return fetch(getApiURL("/lists"), {
    method: "POST",
    body: JSON.stringify(list),
    headers: {
      "X-EchoTab-userId": userId,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then(({ list }) => list);
}
