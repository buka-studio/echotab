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
import { Toggle } from "@echotab/ui/Toggle";
import { cn } from "@echotab/ui/util";
import { useState } from "react";

import TagChip from "../components/tag/TagChip";
import { settingStoreActions, useSettingStore } from "../store/settingStore";
import { tagStoreActions } from "../store/tagStore";
import { toggle } from "../util/set";
import { tagSuggestions } from "./constants";

export default function OnboardingDialog() {
  const { showOnboarding } = useSettingStore((s) => s.settings);

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
    tagStoreActions.createTags(
      Array.from(selectedTagIndices)
        .map((i) => tagSuggestions[i]!)
        .filter(Boolean),
    );
    settingStoreActions.updateSettings({ showOnboarding: false });
  };

  const handleSkip = () => {
    settingStoreActions.updateSettings({ showOnboarding: false });
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
                      "border-dashed bg-transparent": !selectedTagIndices.has(i),
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
            <Button onClick={handleConfirmTags}>Get Started</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
