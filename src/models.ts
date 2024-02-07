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
