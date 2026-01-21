import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { cn } from "@echotab/ui/util";
import { ComponentProps } from "react";

export function DockAction({
  variant,
  className,
  ...props
}: ComponentProps<typeof ButtonWithTooltip>) {
  return (
    <ButtonWithTooltip
      variant="outline"
      size="icon"
      className={cn(
        "dark:bg-card-active border-border-active h-12 w-12 rounded-full shadow-sm transition-all duration-150 ease-in-out hover:scale-105 hover:shadow-lg focus-visible:scale-105 focus-visible:shadow-lg active:scale-95",
        className,
      )}
      {...props}
    />
  );
}

export default function CurateDock({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-border dark:bg-background bg-muted/20 flex items-center gap-8 rounded-full border p-1.5 transition-all duration-200",
        className,
      )}
      {...props}
    />
  );
}
