import { Tag } from "~/models";
import { getBookmarks } from "~/util/import";

import BookmarkStore from "../../Bookmarks/BookmarkStore";
import TagStore from "../../TagStore";

export interface BookmarksImportResult {
  tabsImported: number;
  tagsCreated: number;
  folders: string[];
}

export class BookmarksImporter {
  async import(): Promise<BookmarksImportResult> {
    const { bookmarks, folders } = await getBookmarks();

    const tagsByName = this.getOrCreateTagsForFolders(folders);
    const tabs = this.mapBookmarksToTabs(bookmarks, tagsByName);

    BookmarkStore.saveTabs(tabs);

    return {
      tabsImported: tabs.length,
      tagsCreated: Array.from(folders).filter(
        (f) => !TagStore.tagsByNormalizedName.has(f.trim().toLowerCase()),
      ).length,
      folders: Array.from(folders),
    };
  }

  private getOrCreateTagsForFolders(folders: Set<string>): Map<string, Tag> {
    const tagsByName = new Map<string, Tag>();

    for (const folderName of folders) {
      const normalizedName = folderName.trim().toLowerCase();
      const existingTag = TagStore.tagsByNormalizedName.get(normalizedName);

      if (existingTag) {
        tagsByName.set(folderName, existingTag);
      } else {
        const newTag = TagStore.createTag({ name: folderName });
        if (newTag) {
          tagsByName.set(folderName, newTag);
        }
      }
    }

    return tagsByName;
  }

  private mapBookmarksToTabs(
    bookmarks: Array<{ title: string; url: string; folders: string[] }>,
    tagsByName: Map<string, Tag>,
  ): Array<{ title: string; url: string; tagIds: number[] }> {
    return bookmarks.map((bookmark) => ({
      title: bookmark.title,
      url: bookmark.url,
      tagIds: bookmark.folders
        .map((folder) => tagsByName.get(folder)?.id)
        .filter((id): id is number => id !== undefined),
    }));
  }
}

export default BookmarksImporter;
