import { cn } from "@echotab/ui/util";

import { Separator } from "@echotab/ui/Separator";
import { KeyboardShortcut, KeyboardShortcutKey } from "../components/KeyboardShortcut";
import { useSettingStore } from "../store/settingStore";

function ShortcutItem({ children, shortcut, description }: { children: React.ReactNode; shortcut: string[]; description?: string }) {
  return (
    <li className="flex w-full items-center justify-between">
      <div className="flex flex-col gap-1">
        <span>{children}</span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>
      <KeyboardShortcut>
        {shortcut.map((key) => (
          <KeyboardShortcutKey className={cn("h-5 text-base", {
            'w-5': key.length === 1,
          })} key={key}>{key}</KeyboardShortcutKey>
        ))}
      </KeyboardShortcut>
    </li>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-muted-foreground py-1 text-[0.625rem] font-light tracking-wider uppercase
">
      {children}
    </li>
  );
}

export default function KeyboardShortcuts({ className }: { className?: string }) {
  const activePanel = useSettingStore((s) => s.activePanel);

  return (
    <ul className={cn("flex flex-col gap-3 text-sm", className)}>
      <SectionTitle>General</SectionTitle>
      <ShortcutItem shortcut={["⌘", "k"]}>Open Command Palette</ShortcutItem>
      <ShortcutItem shortcut={["⌘", "f"]}>Open Search</ShortcutItem>
      <ShortcutItem shortcut={["⌘", "a"]}>Select All Items</ShortcutItem>
      <ShortcutItem shortcut={["alt", "t"]} description="With tabs selected">Toggle Tagging</ShortcutItem>
      <Separator />
      <SectionTitle>Curate</SectionTitle>
      <ShortcutItem shortcut={["←"]}>Delete Bookmark</ShortcutItem>
      <ShortcutItem shortcut={["→"]}>Keep Bookmark</ShortcutItem>
      <ShortcutItem shortcut={["↑"]}>Rewind Bookmark</ShortcutItem>
      <ShortcutItem shortcut={["↓"]}>Skip Bookmark</ShortcutItem>
    </ul>
  );
}
