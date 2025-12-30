import { Button } from "@echotab/ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { KeyboardIcon } from "@radix-ui/react-icons";

import KeyboardShortcuts from "./KeyboardShortcuts";

export default function ShortcutsHint({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(className)}>
          <KeyboardIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <KeyboardShortcuts className="py-2" />
      </TooltipContent>
    </Tooltip>
  );
}
