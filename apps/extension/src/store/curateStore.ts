import { toast } from "@echotab/ui/Toast";
import { differenceInDays, differenceInMonths, differenceInWeeks } from "date-fns";
import dayjs from "dayjs";
import { memoize } from "proxy-memoize";
import { useMemo } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { getUtcISO } from "../util/date";
import { createLogger } from "../util/Logger";
import { useBookmarkStore } from "./bookmarkStore";
import { StoragePersistence } from "./persistence";
import { SavedTab, Tag } from "./schema";
import { unassignedTag, useTagsById } from "./tagStore";

const logger = createLogger("CurateStore");

export const timeUnits = ["month", "week", "day"] as const;

export type TimeUnit = (typeof timeUnits)[number];

const inclusion = [
  "ai_tag",
  "quick_tag",
  "unassigned_tag",
  "older_than_threshold",
  "manual",
] as const;

export type Inclusion = (typeof inclusion)[number];

export type InclusionReason = {
  hasUnassignedTags: boolean;
  hasAITags: boolean;
  hasQuickTags: boolean;
  olderThanThreshold: boolean;
  manual?: boolean;
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

const persistence = new StoragePersistence<{
  settings: Settings;
  sessions: Session[];
  lastRemindedAt: string | null;
}>({ key: "echotab-curate-store" });

export interface CurateStore {
  lastRemindedAt: string;
  settings: Settings;
  sessions: Session[];
  initialized: boolean;
  open: boolean;
}

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

export const useCurateStore = create(
  subscribeWithSelector(() => ({
    lastRemindedAt: null as string | null | undefined,
    sessions: [] as Session[],
    settings: defaultSettings,
    initialized: false,
    open: false,
  })),
);

export const setCurateOpen = (open: boolean) => {
  useCurateStore.setState({ open });
};

export const setCurateSettings = (settings: Partial<Settings>) => {
  useCurateStore.setState({ settings: { ...useCurateStore.getState().settings, ...settings } });
};

export const saveCurateSession = (session: Omit<Session, "date">) => {
  useCurateStore.setState((state) => {
    const sessions = [...state.sessions];

    const existingSession = sessions.find((s) => dayjs(s.date).isSame(getUtcISO(), "day"));
    if (existingSession) {
      existingSession.kept += session.kept;
      existingSession.deleted += session.deleted;
    }

    return { sessions };
  });
};

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
    manual: (a, b) => booleanComparator(a.reasons.manual ?? false, b.reasons.manual ?? false),
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
      const comparator = inclusionComparators[inclusion] || ((_a, _b) => 0);
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
};

export const useCurateQueue = ({ manualIds = [] }: { manualIds?: string[] } = {}) => {
  const settings = useCurateStore((s) => s.settings);
  const tabs = useBookmarkStore((s) => s.tabs);
  const tags = useTagsById();

  const queue = useMemo(() => {
    const inclusionResults: Map<string, InclusionResult> = new Map();

    for (const item of tabs) {
      const itemTags = item.tagIds.map((id) => tags.get(id)).filter(Boolean) as Tag[];
      const hasUnassignedTags = itemTags.some((t) => t.id === unassignedTag.id);
      const hasAITags = itemTags.some((t) => t.isAI);
      const hasQuickTags = itemTags.some((t) => t.isQuick);
      const olderThanThreshold = isOlderThanThreshold(
        settings.oldLinkThreshold.unit,
        item.savedAt,
        settings.oldLinkThreshold.value,
      );

      const recentlyCurated =
        item.lastCuratedAt &&
        !isOlderThanThreshold(settings.reminder.unit, item.lastCuratedAt!, settings.reminder.value);

      if (recentlyCurated) {
        continue;
      }

      if (hasUnassignedTags || hasAITags || hasQuickTags || olderThanThreshold) {
        inclusionResults.set(item.id, {
          tabId: item.id,
          reasons: {
            manual: manualIds.includes(item.id),
            hasUnassignedTags,
            hasAITags,
            hasQuickTags,
            olderThanThreshold,
          },
        });
      }
    }

    const inclusionOrder = settings.inclusion;
    const comparator = composeComparators(inclusionOrder);

    const queue = Array.from(inclusionResults.entries())
      .sort((a, b) => comparator(a[1], b[1]))
      .map(([, value]) => value);

    return queue;
  }, [tabs, tags]);

  return queue;
};

const selectCurateTabsById = memoize(
  (state: { tabs: SavedTab[]; curateTabIds: Set<string> }): Record<string, SavedTab> => {
    const { tabs, curateTabIds } = state;
    const result: Record<string, SavedTab> = {};
    for (const tab of tabs) {
      if (curateTabIds.has(tab.id)) {
        result[tab.id] = tab;
      }
    }
    return result;
  },
);

export const useCurateTabsById = (curateQueueItems: InclusionResult[]) => {
  const tabs = useBookmarkStore((s) => s.tabs);
  const curateTabIds = useMemo(
    () => new Set(curateQueueItems.map((result) => result.tabId)),
    [curateQueueItems],
  );
  return selectCurateTabsById({ tabs, curateTabIds });
};

export const initStore = async () => {
  const stored = await persistence.load();
  if (stored) {
    useCurateStore.setState({
      settings: stored.settings,
      sessions: stored.sessions,
      lastRemindedAt: stored.lastRemindedAt ?? "",
    });
  }
  useCurateStore.setState({ initialized: true });
};

useCurateStore.subscribe((store) => {
  if (store.initialized) {
    logger.info("Saving curate store", store);
    persistence.save({
      settings: store.settings,
      sessions: store.sessions,
      lastRemindedAt: store.lastRemindedAt ?? "",
    });
  }
});

export const useCurateReminder = () => {
  const lastRemindedAt = useCurateStore((s) => s.lastRemindedAt);
  const settings = useCurateStore((s) => s.settings);
  const initialized = useCurateStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const lastReminded = dayjs(lastRemindedAt);
    const reminderThreshold = settings.reminder.value;
    const reminderUnit = settings.reminder.unit;

    const reminderDate = lastReminded.add(reminderThreshold, reminderUnit);

    if (reminderDate.isBefore(dayjs())) {
      toast.info("Reminder: Curate your tabs to keep them organized", {
        action: {
          label: "Curate",
          onClick: () => {
            setCurateOpen(true);
          },
        },
      });
      useCurateStore.setState({ lastRemindedAt: getUtcISO() });
    }
  }, [initialized, lastRemindedAt]);
};

export const removeAllItems = () => {
  useCurateStore.setState({ sessions: [], lastRemindedAt: null, settings: defaultSettings });
};

export const curateStoreActions = {
  setCurateOpen,
  setCurateSettings,
  saveCurateSession,
  removeAllItems,
};
