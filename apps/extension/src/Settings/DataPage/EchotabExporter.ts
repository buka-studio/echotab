import { useBookmarkStore } from "~/store/bookmarkStore";
import { useCurateStore } from "~/store/curateStore";
import { unassignedTag, useTagStore } from "~/store/tagStore";
import { downloadJSON } from "~/util";

import { EchotabData } from "./EchotabData";

export class EchotabExporter {
  getData(): EchotabData {
    const tags = Array.from(useTagStore.getState().tags.values())
      .filter((t) => t.id !== unassignedTag.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        favorite: t.favorite ?? false,
        isQuick: t.isQuick ?? false,
        isAI: t.isAI ?? false,
      }));

    const tabs = useBookmarkStore.getState().tabs.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      tagIds: [...t.tagIds],
      faviconUrl: t.favIconUrl,
      pinned: t.pinned,
      savedAt: t.savedAt,
      visitedAt: t.visitedAt,
      lastCuratedAt: t.lastCuratedAt,
      note: t.note,
    }));

    const lists = useBookmarkStore.getState().lists.map((l) => ({
      id: l.id,
      title: l.title,
      content: l.content,
      tabIds: [...l.tabIds],
      savedAt: l.savedAt,
      updatedAt: l.updatedAt,
    }));

    const curations = useCurateStore.getState().sessions.map((s) => ({
      date: s.date,
      kept: s.kept,
      deleted: s.deleted,
    }));

    return { tags, tabs, lists, curations };
  }

  download(filename = `echotab-${Date.now()}.json`) {
    downloadJSON(this.getData() as unknown as Record<string, unknown>, filename);
  }
}

export default EchotabExporter;
