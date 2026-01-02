import { CurateStore } from "~/Curate";
import { downloadJSON } from "~/util";

import BookmarkStore from "../../Bookmarks/BookmarkStore";
import TagStore, { unassignedTag } from "../../TagStore";
import { EchotabData } from "./EchotabData";

export class EchotabExporter {
  getData(): EchotabData {
    const tags = Array.from(TagStore.tags.values())
      .filter((t) => t.id !== unassignedTag.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        favorite: t.favorite ?? false,
        isQuick: t.isQuick ?? false,
        isAI: t.isAI ?? false,
      }));

    const tabs = BookmarkStore.tabs.map((t) => ({
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

    const lists = BookmarkStore.lists.map((l) => ({
      id: l.id,
      title: l.title,
      content: l.content,
      tabIds: [...l.tabIds],
      savedAt: l.savedAt,
      updatedAt: l.updatedAt,
    }));

    const curations = CurateStore.sessions.map((s) => ({
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
