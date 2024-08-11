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
    </div>
  );
}
