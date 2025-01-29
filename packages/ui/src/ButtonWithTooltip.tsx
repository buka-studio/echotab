import { ComponentProps, forwardRef, ReactNode } from "react";

import Button from "./Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";

type Props = ComponentProps<typeof Button> & {
  tooltipText: string;
  tooltipContent?: ReactNode;
  side?: ComponentProps<typeof TooltipContent>["side"];
};

const ButtonWithTooltip = forwardRef<HTMLButtonElement, Props>(
  ({ tooltipText, tooltipContent, side = "bottom", ...props }, ref) => {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button ref={ref} {...props} aria-label={tooltipText} />
          </TooltipTrigger>
          <TooltipContent side={side}>{tooltipContent || <div>{tooltipText}</div>}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

ButtonWithTooltip.displayName = "ButtonWithTooltip";

export default ButtonWithTooltip;
