export interface Tag {
  color: string;
  name: string;
  id: number;
  favorite: boolean;
}

export interface Tab {
  title: string;
  url: string;
  favIconUrl?: string;
}

export interface ActiveTab extends Tab {
  id: number;
  windowId: number;
  pinned?: boolean;
}

export interface SavedTab extends Tab {
  id: string;
  tagIds: number[];
  savedAt: string;
  pinned?: boolean;
}

export enum Panel {
  Tabs = "Tabs",
  Bookmarks = "Bookmarks",
}

export interface Tag {
  color: string;
  name: string;
  id: number;
  favorite: boolean;
}

export interface List {
  id: string;
  title: string;
  content: string;
  sync?: boolean;
  tabIds: string[];
  savedAt: string;
  updatedAt: string;
}
