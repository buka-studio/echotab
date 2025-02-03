import { cn } from "@echotab/ui/util";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onRemove?(): void;
  className?: string;
  color?: string;
  icon?: ReactNode;
}

export default function TagChip({ children, onRemove, className, color, icon }: Props) {
  return (
    <div
      className={cn(
        "relative flex max-w-[150px] items-center overflow-hidden rounded-full border bg-opacity-30 py-[2px] pl-[0.125rem] pr-[0.5rem] text-white grayscale-[0.3] transition-colors duration-150 before:pointer-events-none before:absolute before:inset-0 before:z-[-1] before:bg-[--color] dark:before:opacity-80",
        { "border-border bg-background text-foreground": !color, "pr-3": !onRemove },
        className,
      )}>
      <div
        className={cn("mr-2 h-4 w-4 flex-shrink-0 rounded-full transition-colors duration-150", {
          "w-0": !color,
        })}
        style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="label text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap text-xs transition-colors duration-150">
        {children}
      </div>
      {onRemove && (
        <button
          className="focus-ring text-muted-foreground ml-1 mr-[-4px] rounded-full"
          onClick={onRemove}>
          <Cross2Icon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
