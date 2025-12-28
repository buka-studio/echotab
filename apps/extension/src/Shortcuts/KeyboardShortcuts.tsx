import { cn } from "@echotab/ui/util";

import { KeyboardShortcut, KeyboardShortcutKey } from "../components/KeyboardShortcut";
import { Panel } from "../models";
import { useUIStore } from "../UIStore";

export default function KeyboardShortcuts({ className }: { className?: string }) {
  const { activePanel } = useUIStore();

  return (
    <ul className={cn("flex w-[220px] flex-col gap-2", className)}>
      <li className="flex w-full items-center justify-between">
        <KeyboardShortcut>
          <KeyboardShortcutKey className="h-5 w-5 text-base">⌘</KeyboardShortcutKey>
          <KeyboardShortcutKey className="h-5 w-5 text-sm">k</KeyboardShortcutKey>
        </KeyboardShortcut>
        <span>Open Command Palette</span>
      </li>
      <li className="flex w-full items-center justify-between">
        <KeyboardShortcut>
          <KeyboardShortcutKey className="h-5 w-5 text-base">⌘</KeyboardShortcutKey>
          <KeyboardShortcutKey className="h-5 w-5 text-sm">f</KeyboardShortcutKey>
        </KeyboardShortcut>
        <span>Open search</span>
      </li>
      <li className="flex w-full items-center justify-between">
        <KeyboardShortcut>
          <KeyboardShortcutKey className="h-5 w-5 text-base">⌘</KeyboardShortcutKey>
          <KeyboardShortcutKey className="h-5 w-5 text-sm">a</KeyboardShortcutKey>
        </KeyboardShortcut>
        <span>Select all</span>
      </li>
      {activePanel === Panel.Tabs && (
        <>
          <li className="flex w-full items-center justify-between">
            <KeyboardShortcut>
              <KeyboardShortcutKey className="h-5 text-[0.625rem]">alt</KeyboardShortcutKey>
              <KeyboardShortcutKey className="h-5 w-5 text-sm">t</KeyboardShortcutKey>
            </KeyboardShortcut>
            <div className="flex flex-col gap-1">
              <span>Toggle tagging</span>
              <span className="text-muted-foreground text-xs">with tabs selected</span>
            </div>
          </li>
        </>
      )}
    </ul>
  );
}
