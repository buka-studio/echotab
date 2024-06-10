import { ComponentProps, forwardRef } from "react";

import Button from "./Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";

type Props = ComponentProps<typeof Button> & {
    tooltipText: string;
    side?: ComponentProps<typeof TooltipContent>["side"];
};

const ButtonWithTooltip = forwardRef<HTMLButtonElement, Props>(
    ({ tooltipText, side = "bottom", ...props }, ref) => {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button ref={ref} {...props} />
                    </TooltipTrigger>
                    <TooltipContent side={side}>
                        <div>{tooltipText}</div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    },
);

ButtonWithTooltip.displayName = "ButtonWithTooltip";

export default ButtonWithTooltip;
