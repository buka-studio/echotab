import { Button } from "@echotab/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@echotab/ui/Dialog";
import { toast } from "@echotab/ui/Toast";
import { Toggle } from "@echotab/ui/Toggle";
import { cn } from "@echotab/ui/util";
import { useState } from "react";

import { useBookmarkStore } from "~/Bookmarks";
import { Tag } from "~/models";
import { getBookmarks } from "~/util/import";

import TagChip from "../components/tag/TagChip";
import TagStore, { useTagStore } from "../TagStore";
import UIStore, { useUIStore } from "../UIStore";
import { toggle } from "../util/set";
import { tagSuggestions } from "./constants";

export default function OnboardingDialog() {
  const {
    settings: { showOnboarding },
  } = useUIStore();
  const tagStore = useTagStore();
  const bookmarkStore = useBookmarkStore();

  const [selectedTagIndices, setSelectedTagIndices] = useState(new Set<number>());

  const handleToggleTag = (i: number) => {
    setSelectedTagIndices((indices) => {
      const wip = new Set(indices);
      toggle(wip, i);

      return wip;
    });
  };

  if (!showOnboarding) {
    return null;
  }

  const handleConfirmTags = () => {
    TagStore.createTags(
      Array.from(selectedTagIndices)
        .map((i) => tagSuggestions[i]!)
        .filter(Boolean),
    );
    UIStore.updateSettings({ showOnboarding: false });
  };

  const handleClearAll = () => {
    setSelectedTagIndices(new Set());
  };

  const handleSkip = () => {
    UIStore.updateSettings({ showOnboarding: false });
  };

  const handleImportBookmarks = async () => {
    const { bookmarks, folders } = await getBookmarks();

    const tagsByName: Map<string, Tag> = new Map(
      Array.from(folders).map((f) => {
        if (!tagStore.tagsByNormalizedName.has(f)) {
          return [f, tagStore.createTag({ name: f })];
        }
        return [f, tagStore.tagsByNormalizedName.get(f)!];
      }),
    );

    const tabs = bookmarks.map((b) => ({
      title: b.title,
      url: b.url,
      tagIds: b.folders.map((f) => tagsByName.get(f)!.id),
    }));

    bookmarkStore.saveTabs(tabs);

    toast.success("Imported bookmarks successfully!");
  };

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to EchoTab!</DialogTitle>
          <DialogDescription>
            EchoTab is a Chrome extension that helps you manage your tabs.
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="text-sm">
            To get started, pick some tags from our suggestions to help you find your bookmarks
            fast. You can always add or remove tags later in{" "}
            <span className="font-semibold">Settings</span>.
          </p>
          <div className="my-5 flex flex-wrap gap-2">
            {tagSuggestions.map(({ name, color }, i) => (
              <Toggle
                key={name}
                asChild
                pressed={selectedTagIndices.has(i)}
                className="h-auto rounded-full p-0 px-0"
                onPressedChange={() => handleToggleTag(i)}>
                <button>
                  <TagChip
                    className={cn({
                      "border-dashed": !selectedTagIndices.has(i),
                    })}
                    color={color}
                    indicatorClassName={cn({
                      "opacity-100": selectedTagIndices.has(i),
                      "opacity-60": !selectedTagIndices.has(i),
                    })}>
                    {name}
                  </TagChip>
                </button>
              </Toggle>
            ))}
          </div>
        </div>
        <DialogFooter className="gap-1">
          <DialogClose asChild>
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleConfirmTags} variant="outline">
              Get Started
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
