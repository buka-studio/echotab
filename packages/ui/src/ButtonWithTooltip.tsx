import { ComponentProps, ReactNode } from "react";

import { Button } from "./Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";

type Props = ComponentProps<typeof Button> & {
  tooltipText: string;
  tooltipContent?: ReactNode;
  tooltipContainer?: HTMLElement;
  side?: ComponentProps<typeof TooltipContent>["side"];
};

function ButtonWithTooltip({
  tooltipText,
  tooltipContent,
  side = "bottom",
  tooltipContainer,
  ...props
}: Props) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button {...props} aria-label={tooltipText} />
        </TooltipTrigger>
        <TooltipContent side={side} container={tooltipContainer}>
          {tooltipContent || <div>{tooltipText}</div>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { ButtonWithTooltip };
