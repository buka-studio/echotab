import { cn } from "@echotab/ui/util";

import { KeyboardShortcut, KeyboardShortcutKey } from "../components/KeyboardShortcut";
import { Panel } from "../models";
import { useSettingStore } from "../store/settingStore";

export default function KeyboardShortcuts({ className }: { className?: string }) {
  const activePanel = useSettingStore((s) => s.activePanel);

  return (
    <ul className={cn("flex flex-col gap-4 text-sm", className)}>
      <li className="flex w-full items-center justify-between">
        <span>Open Command Palette</span>
        <KeyboardShortcut>
          <KeyboardShortcutKey className="h-5 w-5 text-base">⌘</KeyboardShortcutKey>
          <KeyboardShortcutKey className="h-5 w-5 text-sm">k</KeyboardShortcutKey>
        </KeyboardShortcut>
      </li>
      <li className="flex w-full items-center justify-between">
        <span>Open search</span>
        <KeyboardShortcut>
          <KeyboardShortcutKey className="h-5 w-5 text-base">⌘</KeyboardShortcutKey>
          <KeyboardShortcutKey className="h-5 w-5 text-sm">f</KeyboardShortcutKey>
        </KeyboardShortcut>
      </li>
      <li className="flex w-full items-center justify-between">
        <span>Select all</span>
        <KeyboardShortcut>
          <KeyboardShortcutKey className="h-5 w-5 text-base">⌘</KeyboardShortcutKey>
          <KeyboardShortcutKey className="h-5 w-5 text-sm">a</KeyboardShortcutKey>
        </KeyboardShortcut>
      </li>
      {activePanel === Panel.Tabs && (
        <>
          <li className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-1">
              <span>Toggle tagging</span>
              <span className="text-muted-foreground text-xs">with tabs selected</span>
            </div>
            <KeyboardShortcut>
              <KeyboardShortcutKey className="h-5 text-[0.625rem]">alt</KeyboardShortcutKey>
              <KeyboardShortcutKey className="h-5 w-5 text-sm">t</KeyboardShortcutKey>
            </KeyboardShortcut>
          </li>
        </>
      )}
    </ul>
  );
}
