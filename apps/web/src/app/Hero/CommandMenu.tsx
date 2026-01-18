import { cn } from "@echotab/ui/util";
import { ComponentProps } from "react";

export default function CommandMenu({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn("herotab focus-ring bg-card border-border relative flex h-11 w-full flex-1 cursor-pointer items-center justify-between rounded-lg border p-3 text-sm shadow-[0_0_0_1px_var(--border)] backdrop-blur-lg transition-all duration-200", className)}
      {...props}>
      <span>Command Menu</span>
      <span className="flex items-center gap-1">
        <span className="keyboard-shortcut flex h-6 w-6 items-center justify-center text-lg">
          ⌘
        </span>
        <span className="keyboard-shortcut flex h-6 w-6 items-center justify-center">K</span>
      </span>
    </button>
  );
}
