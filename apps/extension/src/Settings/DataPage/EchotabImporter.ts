import { Tag } from "~/models";
import { bookmarkStoreActions } from "~/store/bookmarkStore";
import { tagStoreActions, unassignedTag, useTagStore } from "~/store/tagStore";
import { getUtcISO } from "~/util/date";
import { intersection } from "~/util/set";
import { normalizedComparator } from "~/util/string";

import { EchotabData, echotabDataSchema } from "./EchotabData";

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
  private validated: EchotabData | null = null;

  async importFromFile(file: File): Promise<EchotabImportResult> {
    const text = await file.text();
    return this.importFromJSON(text);
  }

  importFromJSON(jsonString: string): EchotabImportResult {
    const parsed = this.parseJSON(jsonString);
    const validated = this.validate(parsed);
    return this.import(validated);
  }

  import(data: EchotabData): EchotabImportResult {
    this.validated = {
      tags: data.tags.map((t) => ({ ...t })),
      tabs: data.tabs.map((t) => ({ ...t, tagIds: [...t.tagIds] })),
      lists: data.lists?.map((l) => ({ ...l, tabIds: [...l.tabIds] })),
      curations: data.curations?.map((c) => ({ ...c })),
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

  private validate(data: unknown): EchotabData {
    const result = echotabDataSchema.safeParse(data);
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

    const importedTagsByNormalizedName = new Map<string, EchotabData["tags"][number]>(
      this.validated.tags.map((t) => [t.name.trim().toLowerCase(), t]),
    );

    const tagsByNormalizedName = tagStoreActions.getTagsNormalizedByName();
    const duplicateNames = intersection(
      Array.from(tagsByNormalizedName.keys()),
      Array.from(importedTagsByNormalizedName.keys()),
    );

    if (duplicateNames.size === 0) return;

    const remappedIds = new Map<number, number>();

    for (const normalizedName of duplicateNames) {
      const importedTag = importedTagsByNormalizedName.get(normalizedName);
      const existingTag = tagsByNormalizedName.get(normalizedName);

      if (importedTag && existingTag && importedTag.id !== existingTag.id) {
        remappedIds.set(importedTag.id, existingTag.id);
      }
    }

    this.applyTagIdRemapping(remappedIds);
  }

  private remapDuplicateTagIds(): void {
    if (!this.validated) return;

    const tags = new Map(useTagStore.getState().tags.map((t) => [t.id, t]));

    const importedTagsById = new Map(this.validated.tags.map((t) => [t.id, t]));
    const duplicateIds = intersection(tags.keys(), importedTagsById.keys());

    duplicateIds.delete(unassignedTag.id);

    if (duplicateIds.size === 0) return;

    const startId = tagStoreActions.getNextTagId();
    let idOffset = 0;

    const remappedIds = new Map<number, number>();

    for (const id of duplicateIds) {
      const existingTag = tags.get(id);
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

    tagStoreActions.addTags(this.validated.tags as Tag[]);
  }

  private importTabs(): void {
    if (!this.validated) return;

    bookmarkStoreActions.importBookmarks({
      tabs: this.validated.tabs.map((t) => ({
        ...t,
        savedAt: t.savedAt ?? getUtcISO(),
      })),
    });
  }
}

export default EchotabImporter;
