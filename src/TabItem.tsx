import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { forwardRef, ReactNode } from "react";
import useSWRImmutable from "swr/immutable";

import { Tab } from "./models";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/HoverCard";
import Spinner from "./ui/Spinner";
import { cn } from "./util";

async function fetchGoogleFavicon(url: string) {
    // todo: store the result in indexeddb?
    try {
        const directRes = await fetch(url);
        if (directRes.status === 200) {
            return directRes.blob();
        }
    } catch (e) {
        console.error(e);
    }

    const domain = new URL(url).hostname;
    const googleRes = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
    if (googleRes.status === 200) {
        return googleRes.blob();
    }

    throw new Error("Failed to fetch favicon");
}

export function Favicon({ src, className }: { className?: string; src?: string }) {
    const { data, error } = useSWRImmutable(src || null, fetchGoogleFavicon, {
        shouldRetryOnError: false,
        dedupingInterval: 1000 * 60 * 60 * 24, // 24 hours
    });

    return (
        <div
            className={cn(
                "h-6 w-6 overflow-hidden rounded shadow-sm",
                {
                    loaded: Boolean(data),
                },
                className,
            )}>
            {data && !error ? (
                <img src={URL.createObjectURL(data)} className="h-full w-full" />
            ) : (
                <div className="fallback h-6 w-6 bg-gradient-to-b from-neutral-500 to-neutral-700" />
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
                "group/item flex min-h-[50px] w-full items-center gap-5 rounded-lg border border-border bg-card p-2 text-card-foreground transition-colors duration-200 @container hover:border-border-active hover:bg-card-active [&:has(:focus-within)]:border-border-active [&:has(:focus-within)]:bg-card-active",
                className,
            )}
            {...props}>
            <div className="flex flex-shrink-0">{icon}</div>
            <span className="max-w-[30cqw] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                {tab.title}
            </span>
            <HoverCard openDelay={1000}>
                <span className="group/link flex max-w-[25cqw] items-center gap-2 transition-colors duration-200">
                    <HoverCardTrigger asChild>{link}</HoverCardTrigger>
                    <ArrowTopRightIcon className="icon h-4 w-4 flex-shrink-0 opacity-0 transition-opacity duration-150 group-hover/link:opacity-100" />
                    <HoverCardContent className="h-[300px] w-[350px] overflow-hidden p-0">
                        <LinkPreview url={tab.url} />
                    </HoverCardContent>
                </span>
            </HoverCard>
            {children}
            <div className="ml-auto max-w-[45cqw] opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100">
                {actions}
            </div>
        </div>
    );
});

export default TabItem;
