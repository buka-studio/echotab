import { Label } from "@echotab/ui/Label";
import Switch from "@echotab/ui/Switch";
import { ToggleGroup, ToggleGroupItem } from "@echotab/ui/ToggleGroup";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";

import { Theme, useUIStore } from "../UIStore";

export default function AppearancePage() {
  const uiStore = useUIStore();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">Favicons</span>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="hide-favicons">
            Hide Favicons in <span>Tabs</span>
          </Label>
          <Switch
            id="hide-tabs-favicons"
            checked={uiStore.settings?.hideTabsFavicons ?? false}
            onCheckedChange={(v) => {
              uiStore.updateSettings({ hideTabsFavicons: v });
            }}
          />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="hide-favicons">
            Hide Favicons in <span>Bookmarks</span>
          </Label>
          <Switch
            id="hide-bookmarks-favicons"
            checked={uiStore.settings?.hideBookmarkFavicons ?? false}
            onCheckedChange={(v) => {
              uiStore.updateSettings({ hideBookmarkFavicons: v });
            }}
          />
        </div>
      </div>
      <hr />
      <div className="text-muted-foreground flex flex-col gap-2 text-sm">
        <Label htmlFor="theme">Theme</Label>
        <ToggleGroup
          className="justify-start"
          id="theme"
          variant="outline"
          type="single"
          value={uiStore.settings.theme}
          onValueChange={(t) => uiStore.updateSettings({ theme: t as Theme })}>
          <ToggleGroupItem value={Theme.Light} aria-label="Set light theme">
            <SunIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value={Theme.Dark} aria-label="Set dark theme">
            <MoonIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value={Theme.System} aria-label="Set system theme">
            <DesktopIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="text-muted-foreground flex flex-col gap-2 text-sm">
        <Label htmlFor="color">Primary color</Label>
        <div className="flex items-center justify-between gap-2">
          <ToggleGroup
            className="justify-start"
            id="color"
            variant="outline"
            type="single"
            value={uiStore.settings.primaryColor}
            onValueChange={(c) => uiStore.updateSettings({ primaryColor: c })}>
            <ToggleGroupItem
              value="20.5 90.2% 48.2%"
              aria-label="Set orange color"
              className="h-auto rounded-full p-1">
              <div
                className="h-5 w-5 rounded-full"
                style={{
                  backgroundColor: `hsl(20.5, 90.2%, 48.2%)`,
                }}
              />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="241 95% 63%"
              aria-label="Set blue color"
              className="h-auto rounded-full p-1">
              <div
                className="h-5 w-5 rounded-full"
                style={{
                  backgroundColor: `hsl(241, 95%, 63%)`,
                }}
              />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="158.11 86.05% 41.91%"
              aria-label="Set green color"
              className="h-auto rounded-full p-1">
              <div
                className="h-5 w-5 rounded-full"
                style={{
                  backgroundColor: `hsl(158.11 86.05% 41.91%)`,
                }}
              />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="311.35 93.94% 41.49%"
              aria-label="Set purple color"
              className="h-auto rounded-full p-1">
              <div
                className="h-5 w-5 rounded-full"
                style={{
                  backgroundColor: `hsl(311.35 93.94% 41.49%)`,
                }}
              />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
