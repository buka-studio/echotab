import { HoverCard, HoverCardContent, HoverCardTrigger } from "@echotab/ui/HoverCard";
import Spinner from "@echotab/ui/Spinner";
import { cn } from "@echotab/ui/util";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { forwardRef, ReactNode } from "react";

import { Tab } from "./models";

function makeFaviconUrl(pageUrl: string) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", "64");

    return url.toString();
}

export function Favicon({ src, className }: { className?: string; src?: string }) {
    return (
        <div
            className={cn(
                "outline-muted-foreground/10 flex h-7 w-7 items-center justify-center overflow-hidden rounded shadow outline outline-1",
                className,
            )}>
            {src ? (
                <div className="relative h-6 w-6 overflow-hidden rounded-[3px]">
                    <img
                        src={makeFaviconUrl(src)}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </div>
            ) : (
                <div className="fallback from-foreground/10 to-foreground/5 h-full w-full bg-gradient-to-b" />
            )}
        </div>
    );
}

// doesn't really work
const LinkPreview = ({ url }: { url: string }) => {
    return (
        <div className="relative h-full w-full">
            <Spinner className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 " />
            <iframe
                src={url}
                title={`Preview of ${url}`}
                scrolling="no"
                className="pointer-events-none relative z-[1] h-full w-full border-none"
                // @ts-ignore
                credentialless="true"
            />
        </div>
    );
};

interface Props {
    tab: Tab;
    actions?: ReactNode;
    className?: string;
    icon?: ReactNode;
    link?: ReactNode;
    children?: ReactNode;
}

const TabItem = forwardRef<HTMLDivElement, Props>(function TabItem(
    { tab, actions, className, icon, link, children, ...props },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                "group/item border-t-border bg-card text-card-foreground @[200px]:flex @[200px]:gap-5 hover:border-border-active hover:bg-card-active [&:has(:focus-within)]:border-border-active [&:has(:focus-within)]:bg-card-active grid min-h-[50px] w-full grid-cols-[auto,1fr] items-center rounded-lg border p-2 shadow-sm transition-colors duration-200 dark:border-x-0 dark:border-b-0",
                className,
            )}
            {...props}>
            <div className="flex flex-shrink-0">{icon}</div>
            <span className="@[200px]:mt-0 @[200px]:max-w-[30cqw] col-[1/3] row-[2] mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                {tab.title}
            </span>
            <HoverCard openDelay={1000}>
                <span className="group/link text-muted-foreground @[200px]:max-w-[25cqw] col-[1/3] row-[3] flex items-center gap-2 transition-colors duration-200">
                    <HoverCardTrigger asChild>{link}</HoverCardTrigger>
                    <ArrowTopRightIcon className="icon h-4 w-4 flex-shrink-0 opacity-0 transition-opacity duration-150 group-hover/link:opacity-100" />
                    <HoverCardContent className="h-[300px] w-[350px] overflow-hidden p-0">
                        <LinkPreview url={tab.url} />
                    </HoverCardContent>
                </span>
            </HoverCard>
            {children}
            <div className="@[200px]:max-w-[45cqw] ml-auto opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100">
                {actions}
            </div>
        </div>
    );
});

export default TabItem;
