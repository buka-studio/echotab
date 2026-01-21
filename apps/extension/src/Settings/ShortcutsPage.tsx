import KeyboardShortcuts from "~/Shortcuts/KeyboardShortcuts";

import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export default function ShortcutsPage() {
  return (
    <SettingsPage>
      <SettingsTitle>Shortcuts</SettingsTitle>

      <SettingsContent className="flex flex-col gap-5">
        <KeyboardShortcuts />
      </SettingsContent>
    </SettingsPage>
  );
}
