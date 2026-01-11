// apps/extension/src/store/zustand/migration.ts
import ChromeLocalStorage from "~/util/ChromeLocalStorage";
import { createLogger } from "~/util/Logger";

const logger = createLogger("StoreMigration");

// The version used by Valtio stores
const VALTIO_VERSION = "1.0"; // Update this to match your actual version

interface MigrationMapping {
  valtioKey: string;
  zustandKey: string;
  transform?: (data: unknown) => unknown;
}

const migrations: MigrationMapping[] = [
  {
    valtioKey: `cmdtab-tag-store-${VALTIO_VERSION}`,
    zustandKey: "echotab-tag-store",
    transform: (data: unknown) => {
      // Valtio stored tags as { tags: { [id]: Tag } }
      // Zustand stores tags as Tag[]
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed?.tags && typeof parsed.tags === "object") {
        const tagsArray = Object.values(parsed.tags);
        return { data: tagsArray, instanceId: crypto.randomUUID(), version: 1 };
      }
      return null;
    },
  },
  {
    valtioKey: `cmdtab-tab-store-${VALTIO_VERSION}`,
    zustandKey: "echotab-bookmark-store",
    transform: (data: unknown) => {
      // Valtio stored { tabs, lists, view }
      // Zustand stores { tabs, lists } (view is not persisted)
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed) {
        return {
          data: {
            tabs: parsed.tabs || [],
            lists: parsed.lists || [],
          },
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
        return {
          data: {
            settings: parsed.settings,
            sessions: parsed.sessions || [],
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
        return {
          data: {
            settings: parsed.settings,
            activePanel: parsed.activePanel,
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

export async function migrateFromValtio(): Promise<void> {
  // Check if migration has already been done
  const migrationComplete = await ChromeLocalStorage.getItem(MIGRATION_COMPLETE_KEY);
  if (migrationComplete) {
    logger.debug("Migration already complete, skipping");
    return;
  }

  logger.info("Starting Valtio to Zustand migration...");

  let migratedCount = 0;
  let skippedCount = 0;

  for (const { valtioKey, zustandKey, transform } of migrations) {
    try {
      // Check if Zustand key already has data
      const existingZustand = await ChromeLocalStorage.getItem(zustandKey);
      if (existingZustand) {
        logger.debug(`Zustand key ${zustandKey} already has data, skipping`);
        skippedCount++;
        continue;
      }

      // Load Valtio data
      const valtioData = await ChromeLocalStorage.getItem(valtioKey);
      if (!valtioData) {
        logger.debug(`No Valtio data found for ${valtioKey}`);
        skippedCount++;
        continue;
      }

      // Transform and save to Zustand key
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

  // Mark migration as complete
  await ChromeLocalStorage.setItem(MIGRATION_COMPLETE_KEY, {
    completedAt: new Date().toISOString(),
  });

  logger.info(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
}

// Optional: Clean up old Valtio keys after successful migration
export async function cleanupValtioKeys(): Promise<void> {
  const migrationComplete = await ChromeLocalStorage.getItem(MIGRATION_COMPLETE_KEY);
  if (!migrationComplete) {
    logger.warn("Migration not complete, skipping cleanup");
    return;
  }

  for (const { valtioKey } of migrations) {
    try {
      await chrome.storage.local.remove(valtioKey);
      logger.debug(`Removed old Valtio key: ${valtioKey}`);
    } catch (error) {
      logger.error(`Failed to remove ${valtioKey}:`, error);
    }
  }
}
