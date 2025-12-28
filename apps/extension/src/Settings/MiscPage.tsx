import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@echotab/ui/AlertDialog";
import { Label } from "@echotab/ui/Label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@echotab/ui/Select";
import Switch from "@echotab/ui/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { useGetPublicLists, useUnpublishAllListsMutation } from "../Bookmarks/Lists/queries";
import { ClipboardFormat, useUIStore } from "../UIStore";
import { getFormattedLinksExample } from "../util";

export default function MiscPage() {
  const uiStore = useUIStore();

  const publicLists = useGetPublicLists();

  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);

  const unpublishMutation = useUnpublishAllListsMutation();

  const handleConfirmUnpublish = () => {
    unpublishMutation.mutate(undefined, {
      onSuccess: () => {
        setUnpublishDialogOpen(false);
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">Search</div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="enter-to-search">Require Enter to search</Label>
          <Switch
            id="enter-to-search"
            checked={uiStore.settings?.enterToSearch ?? true}
            onCheckedChange={(v) => {
              uiStore.updateSettings({ enterToSearch: v });
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">Clipboard</div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="include-tags">Include Tags</Label>
          <Switch
            id="include-tags"
            checked={uiStore.settings?.clipboardIncludeTags ?? false}
            onCheckedChange={(v) => {
              uiStore.updateSettings({ clipboardIncludeTags: v });
            }}
          />
        </div>
        <div className="my-2 flex items-center justify-between space-x-2">
          <span className="flex items-center gap-1">
            <Label htmlFor="clipboard-format">Clipboard Format</Label>
            <Tooltip>
              <TooltipTrigger>
                <InfoCircledIcon className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="mb-5 text-sm">Clipboard content preview:</div>
                <pre className="scrollbar-gray text-muted-foreground font-mono text-xs">
                  {getFormattedLinksExample(
                    uiStore.settings.clipboardFormat,
                    uiStore.settings.clipboardIncludeTags,
                  )}
                </pre>
              </TooltipContent>
            </Tooltip>
          </span>
          <Select
            value={uiStore.settings?.clipboardFormat}
            onValueChange={(v) => {
              uiStore.updateSettings({
                clipboardFormat: v as ClipboardFormat,
              });
            }}>
            <SelectTrigger className="w-[180px]" id="clipboard-format">
              <SelectValue placeholder="Select a format" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.values(ClipboardFormat).map((format) => (
                  <SelectItem key={format} value={format} className="">
                    {format}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <hr className="last:hidden" />
      {import.meta.env.PLASMO_PUBLIC_LIST_SHARING_FF && (
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground mb-2 text-sm">Lists</div>
          <div className="flex items-center justify-between space-x-2">
            <span className="flex items-center gap-1">
              <Label htmlFor="disable-list-sharing">Disable list sharing</Label>
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircledIcon className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-[250px]">
                    Disables list sharing features for a completely offline experience.
                  </div>
                </TooltipContent>
              </Tooltip>
            </span>
            <Switch
              id="disable-list-sharing"
              checked={uiStore.settings?.disableListSharing ?? false}
              onCheckedChange={(v) => {
                uiStore.updateSettings({ disableListSharing: v });
                if (v && publicLists.data?.some((l) => l.published)) {
                  setUnpublishDialogOpen(true);
                }
              }}
            />
            <AlertDialog
              open={unpublishDialogOpen}
              onOpenChange={() => setUnpublishDialogOpen(false)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>You have published lists</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have published lists. Do you also want to unpublish them?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Published</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmUnpublish} variant="destructive">
                    Unpublish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
