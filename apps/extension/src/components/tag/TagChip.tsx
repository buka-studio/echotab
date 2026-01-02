import { cn } from "@echotab/ui/util";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onRemove?(): void;
  className?: string;
  indicatorClassName?: string;
  color?: string;
  icon?: ReactNode;
  variant?: "outline" | "solid";
}

export default function TagChip({
  children,
  onRemove,
  className,
  indicatorClassName,
  color,
  icon,
  variant = "solid",
}: Props) {
  return (
    <div
      className={cn(
        "bg-opacity-30 relative flex max-w-[150px] items-center overflow-hidden rounded-full border py-[2px] pr-2 pl-0.5 text-white grayscale-[0.3] transition-colors duration-150 before:pointer-events-none before:absolute before:inset-0 before:z-[-1] before:bg-(--color) dark:before:opacity-80",
        { "border-border bg-background text-foreground": !color, "pr-3": !onRemove },
        className,
      )}>
      <div
        className={cn(
          "mr-2 h-4 w-4 shrink-0 rounded-full transition-colors duration-150",
          {
            "w-0": !color,
          },
          indicatorClassName,
        )}
        style={
          variant === "solid"
            ? { backgroundColor: color }
            : {
                border: `1px dotted ${color}`,
              }
        }>
        {icon}
      </div>
      <div className="label text-muted-foreground overflow-hidden text-xs text-ellipsis whitespace-nowrap transition-colors duration-150">
        {children}
      </div>
      {onRemove && (
        <button
          className="focus-ring text-muted-foreground mr-[-4px] ml-1 rounded-full"
          onClick={onRemove}>
          <Cross2Icon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
