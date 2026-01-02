import { Popover, PopoverContent, PopoverTrigger } from "@echotab/ui/Popover";
import { cn } from "@echotab/ui/util";
import { CSSProperties, useState } from "react";

import { tagColors } from "../../constants";

interface Props {
  value: string;
  onChange(color: string): void;
}

export default function TagColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="focus-ring border-muted border-opacity-10 h-4 w-4 rounded-full border bg-(--color)"
        style={{ "--color": value } as CSSProperties}
      />
      <PopoverContent className="w-auto min-w-0 p-2">
        <div className="grid w-[95px] grid-cols-[repeat(auto-fill,20px)] justify-center justify-items-center gap-1">
          {tagColors.map((c) => (
            <button
              key={c}
              className={cn(
                "focus-ring h-4 w-4 rounded-full border border-transparent bg-(--color) grayscale-[0.3] transition-all duration-200 hover:scale-110",
              )}
              style={{ "--color": c } as CSSProperties}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
