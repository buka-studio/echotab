import { z } from "zod";

export enum Panel {
  Tabs = "Tabs",
  Bookmarks = "Bookmarks",
  Curate = "Curate",
}

export enum Theme {
  System = "system",
  Dark = "dark",
  Light = "light",
}

export enum ClipboardFormat {
  Text = "Text",
  Markdown = "Markdown",
  JSON = "JSON",
  HTML = "HTML",
}

export type TimeUnit = "month" | "week" | "day";

export const tagColors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

export const defaultTagColor = "#4338ca";
export const staleThresholdDaysInMs = 1000 * 60 * 60 * 24 * 7; // 7 days

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  favorite: z.boolean().default(false),
  isQuick: z.boolean().optional(),
  isAI: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SavedTabSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  favIconUrl: z.string().optional(),
  tagIds: z.array(z.number()),
  pinned: z.boolean().default(false).optional(),
  savedAt: z.string(),
  lastCuratedAt: z.string().optional(),
  note: z.string().optional(),
  visitedAt: z.string().optional(),
});

export const ListSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  tabIds: z.array(z.string()),
  savedAt: z.string(),
  updatedAt: z.string(),
});

export const SettingsSchema = z.object({
  id: z.string(),
  showOnboarding: z.boolean().default(true),
  hideFavicons: z.boolean().default(false),
  theme: z.enum(Theme).default(Theme.System),
  clipboardFormat: z.enum(ClipboardFormat).default(ClipboardFormat.Text),
  clipboardIncludeTags: z.boolean().default(false),
  activePanel: z.enum(Panel).default(Panel.Tabs),
  updatedAt: z.string(),
});

export const CurateSettingsSchema = z.object({
  id: z.string(),
  oldLinkThreshold: z.object({
    unit: z.enum(["month", "week", "day"]),
    value: z.number(),
  }),
  reminder: z.object({
    enabled: z.boolean(),
    lastShownAt: z.string(),
    unit: z.enum(["month", "week", "day"]),
    value: z.number(),
  }),
  inclusion: z.array(z.string()),
  updatedAt: z.string(),
});

export const CurateSessionSchema = z.object({
  id: z.string(),
  kept: z.number(),
  keptIds: z.array(z.string()),
  deleted: z.number(),
  date: z.string(),
});

export const RecentlyClosedTabSchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string(),
  favIconUrl: z.string().optional(),
  windowId: z.number(),
  closedAt: z.string(),
});

export type Tag = z.infer<typeof TagSchema>;
export type SavedTab = z.infer<typeof SavedTabSchema>;
export type List = z.infer<typeof ListSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type CurateSettings = z.infer<typeof CurateSettingsSchema>;
export type CurateSession = z.infer<typeof CurateSessionSchema>;
export type RecentlyClosedTab = z.infer<typeof RecentlyClosedTabSchema>;

export interface ActiveTab {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  windowId: number;
  pinned: boolean;
  lastAccessed?: number;
  audible?: boolean;
  muted?: boolean;
}
