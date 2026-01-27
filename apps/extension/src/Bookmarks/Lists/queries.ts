import { UserList } from "@echotab/lists/models";
import { toast } from "@echotab/ui/Toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSettingStore } from "~/store/settingStore";

import { List } from "../../models";
import { upsertList, useBookmarkStore } from "../../store/bookmarkStore";
import { replaceBy } from "../../util";
import { createLogger } from "../../util/Logger";
import { getLists, publishList, unpublishLists, updateList } from "./api";
import { getPublicListURL } from "./util";

const logger = createLogger("lists:queries");

function getListPayload(list: List) {
  const { tabs } = useBookmarkStore.getState();
  const tabsById = new Map(tabs.map((t) => [t.id, t]));
  return {
    localId: list.id,
    title: list.title,
    content: list.content,
    published: true,
    links: list.tabIds.map((id) => {
      const tab = tabsById.get(id)!;
      return {
        localId: tab.id,
        url: tab.url,
        title: tab.title,
      };
    }),
  };
}

export function useGetPublicLists() {
  const lists = useBookmarkStore((s) => s.lists);
  const listPublishingEnabled = useSettingStore((s) => s.settings.listPublishingEnabled);

  const enabled = listPublishingEnabled && lists.some((l) => l.publicId);

  return useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
    retry: 0,
    enabled,
    refetchOnWindowFocus: false,
  });
}

export function usePublishListMutation() {
  const queryClient = useQueryClient();
  const profileLink = useSettingStore((s) => s.settings.profileLinkUrl);

  return useMutation({
    mutationFn: (list: List) =>
      publishList({ ...getListPayload(list), profileLinkUrl: profileLink }),
    onError: (e) => {
      logger.error("Failed to publish list", e);
      toast.error("Failed to publish collection");
    },
    onSuccess: (newList, list) => {
      upsertList({ ...list, publicId: newList.publicId, published: true });
      toast.success("Collection published", {
        action: {
          label: "View",
          onClick: () => {
            window.open(getPublicListURL(newList.publicId), "_blank");
          },
        },
      });
      queryClient.setQueryData(["lists"], (prev: UserList[] = []) => {
        return [...prev, newList];
      });
    },
  });
}

export function useUpdateListMutation() {
  const queryClient = useQueryClient();
  const profileLink = useSettingStore((s) => s.settings.profileLinkUrl);

  return useMutation({
    mutationFn: (list: List) =>
      updateList(list.id, { ...getListPayload(list), profileLinkUrl: profileLink }),
    onError: (e) => {
      logger.error("Failed to update list", e);
      toast.error("Failed to update collection");
    },
    onSuccess: (updatedList, list) => {
      upsertList({ ...list, publicId: updatedList.publicId, published: updatedList.published });

      toast.success("Collection updated", {
        action: {
          label: "View",
          onClick: () => {
            window.open(getPublicListURL(updatedList.publicId), "_blank");
          },
        },
      });
      queryClient.setQueryData(["lists"], (prev: UserList[] = []) => {
        return replaceBy(prev, updatedList, (l) => l.localId === updatedList.localId);
      });
    },
  });
}

export function useUnpublishAllListsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unpublishLists,
    onSuccess: () => {
      queryClient.setQueryData(["lists"], () => {
        return [];
      });

      useBookmarkStore.setState((state) => ({
        lists: state.lists.map((l) => ({ ...l, published: false })),
      }));

      toast.success("Collections unpublished");
    },
  });
}

export function useUnpublishMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => updateList(listId, { published: false }),
    onError: (e) => {
      logger.error("Failed to unpublish list", e);
      toast.error("Failed to unpublish collection");
    },
    onSuccess: (updatedList, listId) => {
      useBookmarkStore.setState((state) => ({
        lists: state.lists.map((l) => (l.id === listId ? { ...l, published: false } : l)),
      }));
      queryClient.setQueryData(["lists"], (prev: UserList[] = []) => {
        return replaceBy(prev, updatedList, (l) => l.localId === updatedList.localId);
      });

      toast.success("Collection unpublished");
    },
  });
}
