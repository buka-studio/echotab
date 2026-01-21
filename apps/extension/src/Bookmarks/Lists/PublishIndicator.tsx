import { UserList } from "@echotab/lists/models";
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";

import { ComponentProps } from "react";
import { List } from "../../models";

export default function PublishIndicator({
    list,
    publicList,
    className,
    ...props
}: {
    list: List;
    publicList?: UserList;
    className?: string;
} & ComponentProps<typeof TooltipTrigger>) {
    const isUpToDate = useMemo(
        () => publicList && publicList.published && publicList.content === list.content,
        [publicList, list],
    );
    const isOutdated = useMemo(
        () => publicList && publicList.published && publicList.content !== list.content,
        [publicList, list],
    );
    const isUnpublished = !publicList || !publicList.published;

    const publishLabel = isUnpublished
        ? "This collection is not published."
        : isOutdated
            ? "Published collection is outdated."
            : "Published collection is up to date.";

    return (
        <Tooltip>
            <TooltipTrigger className={cn("focus-ring rounded-full", className)} {...props}>
                <div
                    className={cn(
                        "text-muted-foreground h-2 w-2 rounded-full bg-current transition-all duration-200",

                        {
                            "text-muted-foreground": isUnpublished,
                            "text-warning": isOutdated,
                            "text-green-600": isUpToDate,
                        },
                    )}
                />
            </TooltipTrigger>
            <TooltipContent className="text-left">{publishLabel}</TooltipContent>
        </Tooltip>
    );
}
