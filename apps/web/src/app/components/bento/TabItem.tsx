import { cn } from "@echotab/ui/util";
import { ComponentProps } from "react";

export default function TabItem({
    tab,
    className,
    ...props
}: {
    tab: { link?: string; title: string; favicon?: string };
} & ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "tab bg-card text-card-foreground flex min-h-[50px] w-full items-center gap-5 whitespace-nowrap rounded-lg border border-[#2A2726] bg-[#1A1A1A] p-2 px-3 text-neutral-300 shadow-md",
                className,
            )}
            {...props}>
            {tab.favicon ? (
                <img src={tab?.favicon} alt="" className="h-6 w-6" />
            ) : (
                <div className="fallback h-6 w-6 rounded bg-gradient-to-b from-neutral-500 to-neutral-700" />
            )}
            <span>{tab.title}</span>{" "}
            <a
                href={tab.link}
                target="_blank"
                className="cursor-default rounded text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f27239]">
                {tab.link}
            </a>
            <div className="tags flex gap-2 ">
                <div className="tag h-3 w-3 rounded-full bg-purple-500 opacity-0" />
                <div className="tag h-3 w-3 rounded-full bg-neutral-500 opacity-0" />
            </div>
        </div>
    );
}
