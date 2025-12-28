import { tagColors } from "@/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@echotab/ui/Popover";
import { cn } from "@echotab/ui/util";
import { CSSProperties } from "react";

interface Props {
  color: string;
  onChange(color: string): void;
}

export default function TagColorPicker({ color, onChange }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        className="focus-ring border-muted border-opacity-10 h-4 w-4 rounded-full border bg-[--color]"
        style={{ "--color": color } as CSSProperties}
      />
      <PopoverContent className="w-auto">
        <div className="grid w-[95px] grid-cols-[repeat(auto-fill,20px)] gap-1">
          {tagColors.map((c) => (
            <button
              key={c}
              className={cn(
                "focus-ring h-4 w-4 rounded-full border border-transparent bg-[--color] grayscale-[0.3] transition-all duration-200 hover:scale-110",
              )}
              style={{ "--color": c } as CSSProperties}
              onClick={() => {
                onChange(c);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
