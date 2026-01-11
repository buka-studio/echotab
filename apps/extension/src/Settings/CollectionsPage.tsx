import { Input } from "@echotab/ui/Input";
import { Label } from "@echotab/ui/Label";

import { settingStoreActions } from "~/store/settingStore";

import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function CollectionsPage() {
  const handleProfileLinkUpdate = (value: string) => {
    settingStoreActions.updateSettings({
      // profileLink: value,
    });
  };

  return (
    <SettingsPage>
      <SettingsTitle>Collections</SettingsTitle>
      <SettingsContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="old-link-threshold-value">Profile link</Label>
            <div className="text-muted-foreground text-sm">
              Link to your website or social media profile.
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Input
              id="profile-link"
              onChange={(e) => handleProfileLinkUpdate(e.target.value)}
              className=""
            />
          </div>
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
