import { Label } from "@echotab/ui/Label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@echotab/ui/Select";
import { Separator } from "@echotab/ui/Separator";
import { Switch } from "@echotab/ui/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { ClipboardFormat } from "~/store/schema";
import { settingStoreActions, useSettingStore } from "~/store/settingStore";

import { useGetPublicLists, useUnpublishAllListsMutation } from "../Bookmarks/Lists/queries";
import { getFormattedLinksExample } from "../util";
import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function MiscPage() {
  const settings = useSettingStore((s) => s.settings);

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
    <SettingsPage>
      <SettingsTitle>Misc</SettingsTitle>
      <SettingsContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="include-tags">Clipboard Tags</Label>
            <div className="text-muted-foreground text-sm">
              Include or exclude tags when copying links to the clipboard
            </div>
          </div>
          <Switch
            id="include-tags"
            checked={settings?.clipboardIncludeTags ?? false}
            onCheckedChange={(v) => {
              settingStoreActions.updateSettings({ clipboardIncludeTags: v });
            }}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="clipboard-format">
              Clipboard Format{" "}
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircledIcon className="text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="mb-5 text-sm">Clipboard content preview:</div>
                  <pre className="scrollbar-gray text-muted-foreground font-mono text-xs">
                    {getFormattedLinksExample(
                      settings.clipboardFormat,
                      settings.clipboardIncludeTags,
                    )}
                  </pre>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="text-muted-foreground text-sm">
              Set the format when copying links to the clipboard
            </div>
          </div>
          <Select
            value={settings?.clipboardFormat}
            onValueChange={(v) => {
              settingStoreActions.updateSettings({
                clipboardFormat: v as ClipboardFormat,
              });
            }}>
            <SelectTrigger id="clipboard-format">
              <SelectValue placeholder="Select a format..." />
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
      </SettingsContent>
    </SettingsPage>
  );
}
