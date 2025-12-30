import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { cn } from "@echotab/ui/util";
import { ComponentProps } from "react";

export function DockAction({ variant, ...props }: ComponentProps<typeof ButtonWithTooltip>) {
  return (
    <ButtonWithTooltip
      variant="outline"
      size="icon"
      className="bg-card-active border-border-active h-12 w-12 rounded-full shadow-sm transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg focus-visible:scale-110 focus-visible:shadow-lg"
      {...props}
    />
  );
}

export default function CurateDock({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-border bg-background flex items-center gap-10 rounded-full border p-[0.375rem] transition-all duration-200",
        className,
      )}
      {...props}
    />
  );
}
