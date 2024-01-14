export interface Tag {
    color: string;
    name: string;
    id: number;
    favorite: boolean;
}

export interface Tab {
    id: number;
    title: string;
    url: string;
    favIconUrl?: string;
}

export interface ActiveTab extends Tab {
    windowId: number;
    pinned?: boolean;
}

export interface SavedTab extends Tab {
    tagIds: number[];
    savedAt?: number;
}

export enum Panel {
    Active = "Active",
    Saved = "Saved",
}

export interface Tag {
    color: string;
    name: string;
    id: number;
    favorite: boolean;
}
