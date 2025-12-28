export const getBookmarks = async () => {
  const bookmarksRoot = await chrome.bookmarks.getTree();
  const bookmarks: { title: string; url: string; folders: string[] }[] = [];
  const folders: Set<string> = new Set();

  const traverseBookmarks = (node: chrome.bookmarks.BookmarkTreeNode, parents: string[]) => {
    if (!node) {
      return;
    }
    if (node.children) {
      node.children.forEach((child) =>
        traverseBookmarks(child, [...parents, node.title].filter(Boolean)),
      );
    } else if (node.url) {
      bookmarks.push({ title: node.title, url: node.url, folders: [...parents] });
      parents.forEach((p) => folders.add(p.trim()));
    }
  };

  bookmarksRoot.forEach((r) => traverseBookmarks(r, []));

  return { bookmarks, folders };
};
