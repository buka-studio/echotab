import { Label } from "@echotab/ui/Label";
import { Separator } from "@echotab/ui/Separator";
import { Switch } from "@echotab/ui/Switch";
import { ToggleGroup, ToggleGroupItem } from "@echotab/ui/ToggleGroup";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";

import { Theme } from "~/store/schema";
import { settingStoreActions, useSettingStore } from "~/store/settingStore";

import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

const accentColors = [
  {
    name: "Orange",
    lch: "0.69 0.26 36.81",
  },
  {
    name: "Blue",
    lch: "0.47 0.32 264.32",
  },
  {
    name: "Green",
    lch: "0.86 0.31 152.43",
  },
  {
    name: "Purple",
    lch: "0.7 0.34 340.98",
  },
];

export default function AppearancePage() {
  const settings = useSettingStore((s) => s.settings);

  return (
    <SettingsPage>
      <SettingsTitle>Appearance</SettingsTitle>
      <SettingsContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="hide-favicons">Hide Favicons</Label>
            <div className="text-muted-foreground text-sm">Hide favicons for a cleaner look.</div>
          </div>
          <Switch
            id="hide-favicons"
            checked={settings?.hideFavicons ?? false}
            onCheckedChange={(v) => {
              settingStoreActions.updateSettings({ hideFavicons: v });
            }}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex flex-col gap-1">
            <Label htmlFor="theme">Theme</Label>
            <div className="text-muted-foreground text-sm">Change EchoTab's theme.</div>
          </div>
          <ToggleGroup
            id="theme"
            variant="outline"
            type="single"
            value={settings.theme}
            onValueChange={(t) => settingStoreActions.updateSettings({ theme: t as Theme })}>
            <ToggleGroupItem value={Theme.Light} aria-label="Set light theme" size="sm">
              <SunIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value={Theme.Dark} aria-label="Set dark theme" size="sm">
              <MoonIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value={Theme.System} aria-label="Set system theme" size="sm">
              <DesktopIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
