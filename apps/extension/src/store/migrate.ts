import { uuidv7 } from "uuidv7";

import ChromeLocalStorage from "~/util/ChromeLocalStorage";
import { createLogger } from "~/util/Logger";

import { accentColors, Panel, Theme } from "./schema";

const logger = createLogger("StoreMigration");

const VALTIO_VERSION = "1";

interface MigrationMapping {
  valtioKey: string;
  zustandKey: string;
  transform?: (data: unknown) => unknown;
}

interface OldTag {
  id: number;
  name: string;
  color: string;
  favorite: boolean;
  isQuick?: boolean;
  isAI?: boolean;
}

interface OldSettings {
  showOnboarding?: boolean;
  cardSize?: string;
  hideBookmarkFavicons?: boolean;
  hideTabsFavicons?: boolean;
  orientation?: string;
  clipboardFormat?: string;
  clipboardIncludeTags?: boolean;
  theme?: string;
  primaryColor?: string;
  disableListSharing?: boolean;
  aiApiProvider?: string;
  aiApiKey?: string;
  enterToSearch?: boolean;
}

interface OldSession {
  kept: number;
  keptIds: string[];
  deleted: number;
  date: string;
}

const migrations: MigrationMapping[] = [
  {
    valtioKey: `cmdtab-tag-store-${VALTIO_VERSION}`,
    zustandKey: "echotab-tag-store",
    transform: (data: unknown) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed?.tags && typeof parsed.tags === "object") {
        const now = new Date().toISOString();
        const tagsArray = Object.values(parsed.tags as Record<string, OldTag>).map((tag) => ({
          id: tag.id,
          name: tag.name === "Unassigned" ? "Untagged" : tag.name,
          color: tag.color,
          favorite: tag.favorite ?? false,
          isQuick: tag.isQuick,
          isAI: tag.isAI,
          createdAt: now,
          updatedAt: now,
        }));
        return {
          data: { tags: tagsArray },
          instanceId: crypto.randomUUID(),
          version: 1,
        };
      }
      return null;
    },
  },
  {
    valtioKey: `cmdtab-tab-store-${VALTIO_VERSION}`,
    zustandKey: "echotab-bookmark-store",
    transform: (data: unknown) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed) {
        const now = new Date().toISOString();
        const tabs = (parsed.tabs || []).map((tab: Record<string, unknown>) => ({
          id: tab.id || uuidv7(),
          url: tab.url || "",
          title: tab.title || "",
          favIconUrl: tab.favIconUrl,
          tagIds: Array.isArray(tab.tagIds) ? tab.tagIds : [0],
          pinned: tab.pinned ?? false,
          savedAt: tab.savedAt || now,
          lastCuratedAt: tab.lastCuratedAt,
          note: tab.note,
          visitedAt: tab.visitedAt,
        }));
        const lists = (parsed.lists || []).map((list: Record<string, unknown>) => ({
          id: list.id || uuidv7(),
          title: list.title || "",
          content: list.content || "",
          tabIds: Array.isArray(list.tabIds) ? list.tabIds : [],
          savedAt: list.savedAt || now,
          updatedAt: list.updatedAt || now,
        }));
        return {
          data: { tabs, lists },
          instanceId: crypto.randomUUID(),
          version: 1,
        };
      }
      return null;
    },
  },
  {
    valtioKey: `cmdtab-curate-store-${VALTIO_VERSION}`,
    zustandKey: "echotab-curate-store",
    transform: (data: unknown) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed) {
        const sessions = (parsed.sessions || []).map((session: OldSession) => ({
          id: uuidv7(),
          kept: session.kept,
          keptIds: session.keptIds || [],
          deleted: session.deleted,
          date: session.date,
        }));
        return {
          data: {
            settings: parsed.settings || {
              oldLinkThreshold: { unit: "month", value: 1 },
              reminder: { enabled: true, lastShownAt: "", unit: "month", value: 1 },
              inclusion: ["ai_tag", "quick_tag", "unassigned_tag", "older_than_threshold"],
            },
            sessions,
            lastRemindedAt: parsed.lastRemindedAt || null,
          },
          instanceId: crypto.randomUUID(),
          version: 1,
        };
      }
      return null;
    },
  },
  {
    valtioKey: `cmdtab-ui-store-${VALTIO_VERSION}`,
    zustandKey: "echotab-settings",
    transform: (data: unknown) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed) {
        const oldSettings = (parsed.settings || {}) as OldSettings;

        const mapTheme = (theme?: string): string => {
          if (theme === "dark") return Theme.Dark;
          if (theme === "light") return Theme.Light;
          return Theme.System;
        };

        const mapPanel = (panel?: string): string => {
          if (panel === "Bookmarks") return Panel.Bookmarks;
          if (panel === "Curate") return Panel.Curate;
          return Panel.Tabs;
        };

        const newSettings = {
          id: uuidv7(),
          showOnboarding: oldSettings.showOnboarding ?? false,
          hideFavicons: oldSettings.hideBookmarkFavicons ?? oldSettings.hideTabsFavicons ?? false,
          theme: mapTheme(oldSettings.theme),
          clipboardFormat: oldSettings.clipboardFormat || "Text",
          clipboardIncludeTags: oldSettings.clipboardIncludeTags ?? false,
          accentColor: accentColors.Orange,
          updatedAt: new Date().toISOString(),
        };

        return {
          data: {
            settings: newSettings,
            activePanel: mapPanel(parsed.activePanel),
          },
          instanceId: crypto.randomUUID(),
          version: 1,
        };
      }
      return null;
    },
  },
  {
    valtioKey: `cmdtab-recently-closed-${VALTIO_VERSION}`,
    zustandKey: "echotab-recently-closed",
    transform: (data: unknown) => {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (Array.isArray(parsed)) {
        return {
          data: { tabs: parsed },
          instanceId: crypto.randomUUID(),
          version: 1,
        };
      }
      return null;
    },
  },
];

const MIGRATION_COMPLETE_KEY = "echotab-migration-v1-complete";

export async function migrateFromValtio(): Promise<boolean> {
  const migrationComplete = await ChromeLocalStorage.getItem(MIGRATION_COMPLETE_KEY);
  if (migrationComplete) {
    logger.debug("Migration already complete, skipping");
    return false;
  }

  const hasOldData = await hasValtioData();
  if (!hasOldData) {
    logger.debug("No old Valtio data found, skipping migration");
    await ChromeLocalStorage.setItem(MIGRATION_COMPLETE_KEY, {
      completedAt: new Date().toISOString(),
      skippedReason: "no-old-data",
    });
    return false;
  }

  logger.info("Starting Valtio to Zustand migration...");

  let migratedCount = 0;
  let skippedCount = 0;

  for (const { valtioKey, zustandKey, transform } of migrations) {
    try {
      const existingZustand = await ChromeLocalStorage.getItem(zustandKey);
      if (existingZustand) {
        logger.debug(`Zustand key ${zustandKey} already has data, skipping`);
        skippedCount++;
        continue;
      }

      const valtioData = await ChromeLocalStorage.getItem(valtioKey);
      if (!valtioData) {
        logger.debug(`No Valtio data found for ${valtioKey}`);
        skippedCount++;
        continue;
      }

      const transformed = transform ? transform(valtioData) : valtioData;
      if (transformed) {
        await ChromeLocalStorage.setItem(zustandKey, transformed);
        logger.info(`Migrated ${valtioKey} → ${zustandKey}`);
        migratedCount++;
      }
    } catch (error) {
      logger.error(`Failed to migrate ${valtioKey}:`, error);
    }
  }

  await ChromeLocalStorage.setItem(MIGRATION_COMPLETE_KEY, {
    completedAt: new Date().toISOString(),
    migratedCount,
    skippedCount,
  });

  logger.info(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
  return migratedCount > 0;
}

async function hasValtioData(): Promise<boolean> {
  for (const { valtioKey } of migrations) {
    const data = await ChromeLocalStorage.getItem(valtioKey);
    if (data) {
      return true;
    }
  }
  return false;
}

export async function cleanupValtioKeys(): Promise<void> {
  const migrationComplete = await ChromeLocalStorage.getItem(MIGRATION_COMPLETE_KEY);
  if (!migrationComplete) {
    logger.warn("Migration not complete, skipping cleanup");
    return;
  }

  const keysToRemove = [
    ...migrations.map((m) => m.valtioKey),
    `cmdtab-active-store-${VALTIO_VERSION}`,
    "installationId",
  ];

  for (const key of keysToRemove) {
    try {
      await chrome.storage.local.remove(key);
      logger.debug(`Removed old key: ${key}`);
    } catch (error) {
      logger.error(`Failed to remove ${key}:`, error);
    }
  }

  logger.info("Old Valtio keys cleaned up");
}
