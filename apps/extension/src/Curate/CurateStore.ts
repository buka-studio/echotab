import { toast } from "@echotab/ui/Toast";
import { differenceInDays, differenceInMonths, differenceInWeeks } from "date-fns";
import dayjs from "dayjs";
import { derive } from "derive-valtio";
import { proxy, subscribe, useSnapshot } from "valtio";

import { BookmarkStore } from "../Bookmarks";
import { version } from "../constants";
import { Serializable, Tag } from "../models";
import TagStore, { unassignedTag } from "../TagStore";
import { getUtcISO } from "../util/date";
import { createLogger } from "../util/Logger";
import { StoragePersistence } from "../util/StoragePersistence";

const logger = createLogger("CurateStore");

export const timeUnits = ["month", "week", "day"] as const;

export type TimeUnit = (typeof timeUnits)[number];

const inclusion = ["ai_tag", "quick_tag", "unassigned_tag", "older_than_threshold"] as const;

export type Inclusion = (typeof inclusion)[number];

export type InclusionReason = {
  hasUnassignedTags: boolean;
  hasAITags: boolean;
  hasQuickTags: boolean;
  olderThanThreshold: boolean;
};

export interface InclusionResult {
  tabId: string;
  skipped?: boolean;
  unshifted?: boolean;
  reasons: InclusionReason;
}

export interface Settings {
  oldLinkThreshold: {
    unit: TimeUnit;
    value: number;
  };
  reminder: {
    enabled: boolean;
    lastShownAt: string;
    unit: TimeUnit;
    value: number;
  };
  inclusion: Inclusion[];
}

export interface Session {
  kept: number;
  keptIds: string[];
  deleted: number;
  date: string;
}

const storageKey = `cmdtab-curate-store-${version}`;
const persistence = new StoragePersistence({ key: storageKey });

export interface CurateStore extends Serializable<PersistedCurateStore> {
  lastRemindedAt: string;
  settings: Settings;
  sessions: Session[];
  initialized: boolean;
  queue: InclusionResult[];
  open: boolean;
  setOpen: (open: boolean) => void;
  saveSession: (session: Omit<Session, "date">) => void;
  updateSettings(update: Partial<Settings>): void;
  removeAllItems(): void;
  initStore(): Promise<void>;
}

type PersistedCurateStore = Pick<CurateStore, "settings" | "sessions" | "lastRemindedAt">;

const defaultSettings = {
  oldLinkThreshold: {
    unit: "month" as TimeUnit,
    value: 1,
  },
  reminder: {
    enabled: true,
    lastShownAt: "",
    unit: "month" as TimeUnit,
    value: 1,
  },
  inclusion: [...inclusion],
};

const Store = proxy({
  lastRemindedAt: null,
  sessions: [] as Session[],
  settings: defaultSettings,
  initialized: false,
  open: false,
  setOpen: (open: boolean) => {
    Store.open = open;
  },
  updateSettings: (update: Partial<Settings>) => {
    Store.settings = { ...Store.settings, ...update };
  },
  removeAllItems: () => {
    Store.settings = defaultSettings;
  },
  saveSession: (session: Omit<Session, "date">) => {
    // same day session already exists -> update it
    const existingSession = Store.sessions.find((s) => dayjs(s.date).isSame(getUtcISO(), "day"));
    if (existingSession) {
      existingSession.kept += session.kept;
      existingSession.deleted += session.deleted;
    } else {
      Store.sessions.push({ ...session, date: getUtcISO() });
    }
  },
  initStore: async () => {
    const stored = await persistence.load();
    if (stored) {
      const deserialized = Store.deserialize(stored);
      if (deserialized) {
        Object.assign(Store, deserialized);
      }
    }

    persistence.subscribe((data) => {
      const deserialized = Store.deserialize(data);
      if (deserialized) {
        Object.assign(Store, deserialized);
      }
    });

    Store.initialized = true;
  },
  serialize: () => {
    return JSON.stringify({
      settings: Store.settings,
      sessions: Store.sessions,
      lastRemindedAt: Store.lastRemindedAt,
    });
  },
  deserialize: (serialized: string): PersistedCurateStore | undefined => {
    try {
      const init = JSON.parse(serialized) as PersistedCurateStore;
      return {
        settings: { ...Store.settings, ...init.settings },
        sessions: init.sessions,
        lastRemindedAt: init.lastRemindedAt,
      };
    } catch (e) {
      toast.error("Failed to load stored curate settings");
      logger.error("Failed to deserialize curate settings", e);
    }
  },
}) as unknown as CurateStore;

const isOlderThanThreshold = (unit: TimeUnit, date: string, threshold: number) => {
  const getDifferenceFn = (unit: TimeUnit) => {
    return unit === "month"
      ? differenceInMonths
      : unit === "week"
        ? differenceInWeeks
        : differenceInDays;
  };

  const difference = getDifferenceFn(unit);
  return difference(new Date(), new Date(date)) > threshold;
};

function booleanComparator(a: boolean, b: boolean) {
  return a ? 1 : b ? -1 : 0;
}

const inclusionComparators: Record<Inclusion, (a: InclusionResult, b: InclusionResult) => number> =
  {
    ai_tag: (a, b) => booleanComparator(a.reasons.hasAITags, b.reasons.hasAITags),
    quick_tag: (a, b) => booleanComparator(a.reasons.hasQuickTags, b.reasons.hasQuickTags),
    unassigned_tag: (a, b) =>
      booleanComparator(a.reasons.hasUnassignedTags, b.reasons.hasUnassignedTags),
    older_than_threshold: (a, b) =>
      booleanComparator(a.reasons.olderThanThreshold, b.reasons.olderThanThreshold),
  };

const composeComparators = (inclusions: Inclusion[]) => {
  return (a: InclusionResult, b: InclusionResult) => {
    for (const inclusion of inclusions) {
      const comparator = inclusionComparators[inclusion] || ((a, b) => 0);
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
};

derive(
  {
    queue: (get) => {
      const store = get(Store);
      const items = get(BookmarkStore.tabs);
      const tags = get(TagStore.tags);

      const inclusionResults: Map<string, InclusionResult> = new Map();

      for (const item of items) {
        const itemTags = item.tagIds.map((id) => tags.get(id)).filter(Boolean) as Tag[];
        const hasUnassignedTags = itemTags.some((t) => t.id === unassignedTag.id);
        const hasAITags = itemTags.some((t) => t.isAI);
        const hasQuickTags = itemTags.some((t) => t.isQuick);
        const olderThanThreshold = isOlderThanThreshold(
          store.settings.oldLinkThreshold.unit,
          item.savedAt,
          store.settings.oldLinkThreshold.value,
        );

        const recentlyCurated =
          item.lastCuratedAt &&
          !isOlderThanThreshold(
            store.settings.reminder.unit,
            item.lastCuratedAt!,
            store.settings.reminder.value,
          );

        if (recentlyCurated) {
          continue;
        }

        if (hasUnassignedTags || hasAITags || hasQuickTags || olderThanThreshold) {
          inclusionResults.set(item.id, {
            tabId: item.id,
            reasons: {
              hasUnassignedTags,
              hasAITags,
              hasQuickTags,
              olderThanThreshold,
            },
          });
        }
      }

      const inclusionOrder = store.settings.inclusion;
      const comparator = composeComparators(inclusionOrder);

      const queue = Array.from(inclusionResults.entries())
        .sort((a, b) => comparator(a[1], b[1]))
        .map(([, value]) => value);

      return queue;
    },
  },
  {
    proxy: Store,
  },
);

subscribe(Store, () => {
  if (Store.initialized) {
    persistence.save(Store.serialize());
  }
});

export const useCurateStore = () => useSnapshot(Store) as typeof Store;

export default Store;
