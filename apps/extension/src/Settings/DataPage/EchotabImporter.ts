import { z } from "zod";

import { Tag } from "~/models";
import { getUtcISO } from "~/util/date";
import { intersection } from "~/util/set";
import { normalizedComparator } from "~/util/string";

import BookmarkStore from "../../Bookmarks/BookmarkStore";
import TagStore, { unassignedTag } from "../../TagStore";

export const echotabImportSchema = z.object({
  tags: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      color: z.string(),
      favorite: z.boolean().default(false),
      isQuick: z.boolean().default(false),
      isAI: z.boolean().default(false),
    }),
  ),
  tabs: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      url: z.string(),
      tagIds: z.array(z.number()),
      faviconUrl: z.string().optional(),
      pinned: z.boolean().optional(),
      savedAt: z.string().optional(),
      visitedAt: z.string().optional(),
      lastCuratedAt: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
  lists: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        content: z.string(),
        tabIds: z.array(z.string().uuid()),
        savedAt: z.string().optional(),
        updatedAt: z.string().optional(),
      }),
    )
    .optional(),
});

export type EchotabImportData = z.infer<typeof echotabImportSchema>;

export interface EchotabImportResult {
  tabsImported: number;
  tagsImported: number;
  listsImported: number;
}

export class EchotabImportError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EchotabImportError";
  }
}

export class EchotabImporter {
  private validated: EchotabImportData | null = null;

  async importFromFile(file: File): Promise<EchotabImportResult> {
    const text = await file.text();
    return this.importFromJSON(text);
  }

  importFromJSON(jsonString: string): EchotabImportResult {
    const parsed = this.parseJSON(jsonString);
    const validated = this.validate(parsed);
    return this.import(validated);
  }

  import(data: EchotabImportData): EchotabImportResult {
    this.validated = {
      tags: data.tags.map((t) => ({ ...t })),
      tabs: data.tabs.map((t) => ({ ...t, tagIds: [...t.tagIds] })),
      lists: data.lists?.map((l) => ({ ...l, tabIds: [...l.tabIds] })),
    };

    this.remapDuplicateTagNames();
    this.remapDuplicateTagIds();
    this.importTags();
    this.importTabs();

    return {
      tabsImported: this.validated.tabs.length,
      tagsImported: this.validated.tags.length,
      listsImported: this.validated.lists?.length ?? 0,
    };
  }

  private parseJSON(jsonString: string): unknown {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new EchotabImportError("Invalid JSON format", error);
    }
  }

  private validate(data: unknown): EchotabImportData {
    const result = echotabImportSchema.safeParse(data);
    if (!result.success) {
      throw new EchotabImportError(
        `Invalid import data: ${result.error.issues.map((e) => e.message).join(", ")}`,
        result.error,
      );
    }
    return result.data;
  }

  private remapDuplicateTagNames(): void {
    if (!this.validated) return;

    const importedTagsByNormalizedName = new Map<string, EchotabImportData["tags"][number]>(
      this.validated.tags.map((t) => [t.name.trim().toLowerCase(), t]),
    );

    const duplicateNames = intersection(
      Array.from(TagStore.tagsByNormalizedName.keys()),
      Array.from(importedTagsByNormalizedName.keys()),
    );

    if (duplicateNames.size === 0) return;

    const remappedIds = new Map<number, number>();

    for (const normalizedName of duplicateNames) {
      const importedTag = importedTagsByNormalizedName.get(normalizedName);
      const existingTag = TagStore.tagsByNormalizedName.get(normalizedName);

      if (importedTag && existingTag && importedTag.id !== existingTag.id) {
        remappedIds.set(importedTag.id, existingTag.id);
      }
    }

    this.applyTagIdRemapping(remappedIds);
  }

  private remapDuplicateTagIds(): void {
    if (!this.validated) return;

    const importedTagsById = new Map(this.validated.tags.map((t) => [t.id, t]));
    const duplicateIds = intersection(TagStore.tags.keys(), importedTagsById.keys());

    duplicateIds.delete(unassignedTag.id);

    if (duplicateIds.size === 0) return;

    const startId = TagStore.getNextTagId();
    let idOffset = 0;

    const remappedIds = new Map<number, number>();

    for (const id of duplicateIds) {
      const existingTag = TagStore.tags.get(id);
      const importedTag = importedTagsById.get(id);

      if (
        existingTag &&
        importedTag &&
        normalizedComparator(existingTag.name, importedTag.name) !== 0
      ) {
        remappedIds.set(id, startId + idOffset++);
      }
    }

    this.applyTagIdRemapping(remappedIds);
  }

  private applyTagIdRemapping(remappedIds: Map<number, number>): void {
    if (!this.validated || remappedIds.size === 0) return;

    for (const tab of this.validated.tabs) {
      const needsRemap = intersection(remappedIds.keys(), tab.tagIds);
      if (needsRemap.size > 0) {
        tab.tagIds = tab.tagIds.map((id) => remappedIds.get(id) ?? id);
      }
    }

    for (const tag of this.validated.tags) {
      if (remappedIds.has(tag.id)) {
        tag.id = remappedIds.get(tag.id)!;
      }
    }
  }

  private importTags(): void {
    if (!this.validated) return;

    TagStore.import({
      tags: new Map(this.validated.tags.map((t) => [t.id, t as Tag])),
    });
  }

  private importTabs(): void {
    if (!this.validated) return;

    BookmarkStore.import({
      tabs: this.validated.tabs.map((t) => ({
        ...t,
        savedAt: t.savedAt ?? getUtcISO(),
      })),
    });
  }
}

export default EchotabImporter;
