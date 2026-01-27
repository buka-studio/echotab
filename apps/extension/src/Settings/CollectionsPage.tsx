import { Input } from "@echotab/ui/Input";
import { Label } from "@echotab/ui/Label";
import { Separator } from "@echotab/ui/Separator";
import { Switch } from "@echotab/ui/Switch";

import { settingStoreActions, useSettingStore } from "~/store/settingStore";

import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function CollectionsPage() {
  const settings = useSettingStore((s) => s.settings);

  const handleProfileLinkUpdate = (value: string) => {
    settingStoreActions.updateSettings({
      profileLinkUrl: value,
    });
  };

  return (
    <SettingsPage>
      <SettingsTitle>Collections</SettingsTitle>
      <SettingsContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="list-publishing">Enable Collections Publishing</Label>
            <div className="text-muted-foreground text-sm">
              Enable the option to share your collections publicly.
            </div>
          </div>
          <Switch
            id="list-publishing"
            checked={settings?.listPublishingEnabled ?? false}
            onCheckedChange={(v) => {
              settingStoreActions.updateSettings({ listPublishingEnabled: v });
            }}
          />
        </div>
        {settings?.listPublishingEnabled && (
          <>
            <Separator />
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="profile-link">Profile Link</Label>
                <div className="text-muted-foreground text-sm">
                  Link to your website or social media profile on public collections.
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  placeholder="https://example.com"
                  id="profile-link"
                  value={settings?.profileLinkUrl ?? ""}
                  onChange={(e) => handleProfileLinkUpdate(e.target.value)}
                  onBlur={(e) => {
                    handleProfileLinkUpdate(e.target.value);
                  }}
                />
              </div>
            </div>
          </>
        )}
      </SettingsContent>
    </SettingsPage>
  );
}
