import Button from "@echotab/ui/Button";
import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { Checkbox } from "@echotab/ui/Checkbox";
import { Label } from "@echotab/ui/Label";
import Spinner from "@echotab/ui/Spinner";
import { cn } from "@echotab/ui/util";
import {
  GlobeSimple as GlobeSimpleIcon,
  Sparkle as SparkleIcon,
  X as XIcon,
} from "@phosphor-icons/react";
import { LightningBoltIcon } from "@radix-ui/react-icons";
import { Command as CommandPrimitive } from "cmdk";
import { motion } from "framer-motion";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

import { useActiveTabStore } from "../ActiveTabs/ActiveStore";
import { useLLMTagMutation } from "../AI/queries";
import TagChip from "../components/tag/TagChip";
import { ActiveTab } from "../models";
import PulseLogo from "../PulseLogo";
import TagStore, { unassignedTag, useTagStore } from "../TagStore";
import { useUIStore } from "../UIStore";
import { getWidgetRoot } from "./util";

const HeaderUrl = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={cn(
      "text-muted-foreground border-border flex items-center gap-2 overflow-hidden rounded-full border px-2 py-1 pl-1 text-xs",
      className,
    )}>
    <GlobeSimpleIcon className="h-4 w-4 flex-shrink-0" />
    <span className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
      {children}
    </span>
  </div>
);

export interface Props {
  onClose: () => void;
}

const exactMatchFilter = (value: string, search: string) => {
  if (value.toLowerCase().includes(search.toLowerCase())) {
    return 1;
  }

  return 0;
};

function Widget({ onClose }: Props) {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const activeStore = useActiveTabStore();
  const tagStore = useTagStore();
  const uiStore = useUIStore();

  const [closeAfterSave, setCloseAfterSave] = useState(true);
  const [saved, setSaved] = useState(false);

  const [search, setSearch] = useState("");
  const [assignedTagIds, setAssignedTagIds] = useState<number[]>([]);

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "tab-info" }).then(({ tab }) => {
      setTab(tab);
    });
  }, []);

  const handleToggleTag = (tagId: number) => {
    setAssignedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      return [...prev, tagId];
    });
  };

  const handleCloseAfterSave = (result: { tabId: number; saveId: string }) => {
    setSaved(true);

    setTimeout(() => {
      onClose();
      if (closeAfterSave) {
        chrome.runtime.sendMessage({
          action: "tab-close",
          tabId: result.tabId,
          saveId: result.saveId,
        });
      }
    }, 1500);
  };

  const handleSave = () => {
    if (!tab) return;

    activeStore.saveTabsSeq([{ ...tab, tagIds: assignedTagIds }], false, false).then((results) => {
      const result = results.success[0];
      handleCloseAfterSave(result);
    });
  };

  const aiEnabled = Boolean(uiStore.settings.aiApiProvider);

  const llmMutation = useLLMTagMutation();

  const handleAITag = async () => {
    if (!tab || !aiEnabled) return;

    const tags = await llmMutation.mutateAsync({
      tabs: [tab as ActiveTab],
      tags: Array.from(tagStore.tags.values()),
    });

    const created = tagStore.createTags(tags.map((tag) => ({ name: tag, isAI: true })));

    for (const tag of created) {
      handleToggleTag(tag.id);
    }
  };

  const handleCreateTag = () => {
    if (!search) return;

    const newTag = tagStore.createTag({ name: search });
    handleToggleTag(newTag.id);
    setSearch("");
  };

  const handleQuickSave = () => {
    if (!tab) return;

    const tagName = TagStore.getQuickSaveTagName(false);
    const quickTag = tagStore.createTag({ name: tagName, isQuick: true });

    activeStore.saveTabsSeq([{ ...tab, tagIds: [quickTag.id] }], false, false).then((results) => {
      const result = results.success[0];
      handleCloseAfterSave(result);
    });
  };

  const commandRef = useRef<HTMLDivElement>(null);

  const getValue = () => {
    const highlighted = commandRef.current?.querySelector(`[cmdk-item=""][aria-selected="true"]`);
    if (highlighted) {
      return (highlighted as HTMLElement)?.dataset?.value;
    }
  };

  return (
    <>
      <div className="bg-background-base border-border rounded-xl border p-4 shadow-sm">
        <div className="mx-auto flex items-center justify-between gap-3 rounded-full text-sm">
          <div className="flex items-center gap-1">
            <PulseLogo />{" "}
            <button
              onClick={() => window.open(chrome.runtime.getURL("newtab.html"), "_blank")}
              className="text-muted-foreground">
              EchoTab
            </button>
          </div>
          <HeaderUrl>{tab?.url}</HeaderUrl>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-foreground">
            <XIcon />
          </Button>
        </div>
        <div className="mb-1 mt-4">
          <CommandPrimitive
            ref={commandRef}
            loop
            filter={exactMatchFilter}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && !getValue() && search) {
                e.preventDefault();
                handleCreateTag();
              }
            }}>
            <div className="border-border focus-within:bg-muted/60 mb-3 flex w-full items-center gap-2 rounded-lg border p-2 pl-3 transition-all duration-200">
              <CommandPrimitive.Input
                placeholder="Search or create tags"
                className="placeholder:text-muted-foreground text-muted-foreground w-full flex-1 border-dashed bg-transparent text-sm focus-visible:outline-none"
                value={search}
                onValueChange={(v) => setSearch(v)}
              />
              <div className="flex items-center gap-2">
                <ButtonWithTooltip
                  tooltipText="Quick save"
                  tooltipContainer={getWidgetRoot()}
                  variant="secondary"
                  size="icon-sm"
                  onClick={handleQuickSave}>
                  <LightningBoltIcon className="text-muted-foreground" />
                </ButtonWithTooltip>
                {false && (
                  <ButtonWithTooltip
                    tooltipText={aiEnabled ? "AI tag" : "AI tagging disabled"}
                    tooltipContainer={getWidgetRoot()}
                    variant="secondary"
                    size="icon-sm"
                    onClick={handleAITag}>
                    <Spinner
                      className={cn(
                        "pointer-events-none absolute h-auto w-auto transition-opacity duration-150 [&>svg]:h-4 [&>svg]:w-4",
                        {
                          "opacity-0": !llmMutation.isPending,
                        },
                      )}
                    />

                    <SparkleIcon
                      className={cn("text-muted-foreground transition-opacity duration-150", {
                        "opacity-50": !aiEnabled,
                        "opacity-0": llmMutation.isPending,
                      })}
                    />
                  </ButtonWithTooltip>
                )}
              </div>
            </div>
            <CommandPrimitive.List className="[&>*]:scrollbar-gray flex focus-visible:outline-none [&>*:focus-visible]:outline-none [&>*]:flex [&>*]:max-w-full [&>*]:gap-2 [&>*]:overflow-auto [&>*]:pb-3">
              <CommandPrimitive.Empty
                className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm"
                onClick={handleCreateTag}>
                {search ? (
                  <span className="inline-flex gap-2">
                    Create <TagChip className="text-sm">{search}</TagChip>
                  </span>
                ) : (
                  "Type to create a tag"
                )}
              </CommandPrimitive.Empty>

              {Array.from(tagStore.tags.values())
                .reverse()
                .filter((t) => t.id !== unassignedTag.id)
                .map((t) => (
                  <CommandPrimitive.Item
                    className="group"
                    key={t.id}
                    value={t.name}
                    onClick={() => {
                      setSearch("");
                      handleToggleTag(t.id);
                    }}
                    onSelect={() => {
                      setSearch("");
                      handleToggleTag(t.id);
                    }}>
                    <TagChip
                      color={t.color}
                      className={cn("group-aria-selected:border-ring cursor-pointer select-none", {
                        "bg-foreground [&>.label]:text-background": assignedTagIds.includes(t.id),
                      })}>
                      {t.name}
                    </TagChip>
                  </CommandPrimitive.Item>
                ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="close-after-save"
              checked={closeAfterSave}
              onCheckedChange={() => setCloseAfterSave((c) => !c)}
            />
            <Label htmlFor="close-after-save" className="text-muted-foreground">
              Close tab after saving
            </Label>
          </div>

          <Button onClick={handleSave} variant="default">
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
      {saved && (
        <span
          className="glow-outline rounded-xl"
          style={
            {
              "--width": 2,
              "--radius": 12,
            } as CSSProperties
          }>
          <motion.span
            className="after"
            animate={{
              opacity: [0.75, 1, 0],
              offsetDistance: ["50%", "75%", "100%"],
              transition: {
                duration: 1.25,
                ease: "easeInOut",
              },
            }}
          />
          <motion.span
            className="before"
            animate={{
              opacity: [0.75, 1, 0],
              offsetDistance: ["0%", "25%", "50%"],
              transition: {
                duration: 1.25,
                ease: "easeInOut",
              },
            }}
          />
        </span>
      )}
    </>
  );
}

export default Widget;
