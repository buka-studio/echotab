import { Button } from "@echotab/ui/Button";
import { Label } from "@echotab/ui/Label";

import { useUIStore } from "../UIStore";
import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function AppearancePage() {
  const uiStore = useUIStore();

  return (
    <SettingsPage>
      <SettingsTitle>Account</SettingsTitle>
      <SettingsContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between space-x-2">
          <div>
            <Label htmlFor="hide-favicons">Account</Label>
            <div className="text-muted-foreground text-sm">Connect your account.</div>
          </div>

          <Button>Continue with Google</Button>
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
