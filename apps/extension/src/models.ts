export interface Tag {
  color: string;
  name: string;
  id: number;
  favorite: boolean;
  isQuick?: boolean;
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
  muted?: boolean;
  lastAccessed?: number;
}

export interface SavedTab extends Tab {
  id: string;
  tagIds: number[];
  savedAt: string;
  visitedAt?: string;
  note?: string;
  pinned?: boolean;
  metadata?: {
    description?: string;
  };
}

export enum Panel {
  Tabs = "Tabs",
  Bookmarks = "Bookmarks",
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

export type Message = {
  type: "snapshot_tmp";
  tabId: number;
  url: string;
};

export type MessageType = Message["type"];
