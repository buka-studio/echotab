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
        "tab bg-card text-card-foreground border-border hover:bg-card-active flex min-h-[50px] w-full items-center gap-3 whitespace-nowrap rounded-lg border p-2 px-3 dark:shadow-md",
        className,
      )}
      {...props}>
      <div className="border-border flex-shrink-0 rounded border p-1 shadow-sm">
        {tab.favicon ? (
          <div className="overflow-hidden rounded">
            <img src={tab?.favicon} alt="" className="h-6 w-6 object-cover object-center" />
          </div>
        ) : (
          <div className="fallback h-6 w-6 rounded bg-gradient-to-b from-neutral-500 to-neutral-700" />
        )}
      </div>
      <span className="text-sm">{tab.title}</span>{" "}
      <a
        href={tab.link}
        target="_blank"
        className="text-muted-foreground focus-ring cursor-default overflow-hidden text-ellipsis rounded text-xs focus-visible:outline-none focus-visible:ring-1">
        {tab.link}
      </a>
      <div className="tags flex gap-2">
        <div className="tag h-5 w-2 rounded-full bg-purple-500 opacity-0" />
        <div className="tag h-5 w-2 rounded-full bg-neutral-500 opacity-0" />
      </div>
    </div>
  );
}
