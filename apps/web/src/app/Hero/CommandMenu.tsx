import { ComponentProps } from "react";

export default function CommandMenu({ ...props }: ComponentProps<"div">) {
  return (
    <div
      className="herotab focus-ring bg-card/40 relative mb-10 flex h-11 w-full flex-1 items-center justify-between rounded-lg border p-3 text-sm shadow-[0_0_0_3px_hsl(var(--border))] backdrop-blur-lg transition-all duration-200"
      {...props}>
      <span>Command Menu</span>
      <span className="flex items-center gap-1">
        <span className="keyboard-shortcut flex h-6 w-6 items-center justify-center text-lg">
          ⌘
        </span>
        <span className="keyboard-shortcut flex h-6 w-6 items-center justify-center">K</span>
      </span>
    </div>
  );
}
