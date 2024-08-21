import Button from "@echotab/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@echotab/ui/Dialog";
import { Toggle } from "@echotab/ui/Toggle";
import { cn } from "@echotab/ui/util";
import { useState } from "react";

import TagChip from "../components/TagChip";
import TagStore from "../TagStore";
import UIStore, { useUIStore } from "../UIStore";
import { toggle } from "../util/set";
import { tagSuggestions } from "./constants";

export default function OnboardingDialog() {
  const {
    settings: { showOnboarding },
  } = useUIStore();

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
    TagStore.createTags(Array.from(selectedTagIndices).map((i) => tagSuggestions[i]));
    UIStore.updateSettings({ showOnboarding: false });
  };

  const handleClearAll = () => {
    setSelectedTagIndices(new Set());
  };

  const handleSkip = () => {
    UIStore.updateSettings({ showOnboarding: false });
  };

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to EchoTab!</DialogTitle>
          <DialogDescription>
            EchoTab is a Chrome extensions that helps you manage your tabs.
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="text-sm">
            To get started, pick some tags from our suggestions to help you find your bookmarks
            fast. You can always add or remove tags later in Settings.
          </p>
          <div className="my-5 flex flex-wrap gap-2">
            {tagSuggestions.map(({ name, color }, i) => (
              <Toggle
                key={name}
                asChild
                pressed={selectedTagIndices.has(i)}
                className="p-0 px-0"
                onPressedChange={() => handleToggleTag(i)}>
                <button className={cn("h-auto")}>
                  <TagChip color={selectedTagIndices.has(i) ? color : undefined}>{name}</TagChip>
                </button>
              </Toggle>
            ))}
            {/* <Button
              disabled={selectedTagIndices.size === 0}
              className="mr-auto"
              variant="ghost"
              onClick={handleClearAll}>
              Clear all
            </Button> */}
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
