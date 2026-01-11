import { Tag } from "~/models";
import { bookmarkStoreActions } from "~/store/bookmarkStore";
import { tagStoreActions } from "~/store/tagStore";
import { getBookmarks } from "~/util/import";

// import BookmarkStore from "../../Bookmarks/BookmarkStore";
// import TagStore from "../../TagStore";

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

    bookmarkStoreActions.saveTabs(tabs);

    return {
      tabsImported: tabs.length,
      tagsCreated: Array.from(folders).filter(
        (f) => !tagStoreActions.getTagsNormalizedByName().has(f.trim().toLowerCase()),
      ).length,
      folders: Array.from(folders),
    };
  }

  private getOrCreateTagsForFolders(folders: Set<string>): Map<string, Tag> {
    const tagsByName = new Map<string, Tag>();

    for (const folderName of folders) {
      const normalizedName = folderName.trim().toLowerCase();
      const existingTag = tagStoreActions.getTagsNormalizedByName().get(normalizedName);

      if (existingTag) {
        tagsByName.set(folderName, existingTag);
      } else {
        const newTag = tagStoreActions.createTags([{ name: folderName }]);
        if (newTag[0]) {
          tagsByName.set(folderName, newTag[0]);
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
