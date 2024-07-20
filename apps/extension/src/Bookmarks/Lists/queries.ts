import { UserList } from "@echotab/lists/models";
import { toast } from "@echotab/ui/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { List } from "~/src/models";
import { replaceBy } from "~/src/util";

import BookmarkStore from "../BookmarkStore";
import { publishList, updateList } from "./api";

function getListPayload(list: List) {
  return {
    localId: list.id,
    title: list.title,
    content: list.content,
    published: true,
    links: list.tabIds.map((id) => {
      const tab = BookmarkStore.viewTabsById[id];
      return {
        localId: tab.id,
        url: tab.url,
        title: tab.title,
      };
    }),
  };
}

export function usePublishListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (list: List) => publishList(getListPayload(list)),
    onError: (e) => {
      console.error(e);
      // handle 403 - too many published lists
      toast.error("Failed to publish list. Please try again.");
    },
    onSuccess: (newList) => {
      toast.success("List published successfully!");
      queryClient.setQueryData(["lists"], (prev: UserList[]) => {
        return [...prev, newList];
      });
    },
  });
}

export function useUpdateListMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (list: List) => updateList(list.id, getListPayload(list)),
    onError: (e) => {
      console.error(e);
      toast.error("Failed to update list. Please try again.");
    },
    onSuccess: (updatedList) => {
      toast.success("Public list updated successfully!");
      queryClient.setQueryData(["lists"], (prev: UserList[]) => {
        return replaceBy(prev, updatedList, (l) => l.localId === updatedList.localId);
      });
    },
  });
}
