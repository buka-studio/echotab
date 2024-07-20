import { cn } from "@echotab/ui/util";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { Favicon } from "../TabItem";

import "./ItemListPlaceholder.css";

export function ItemListPlaceholderCopy({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="absolute left-1/2 top-1/2 z-[1] w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
      <div className="text-balance text-lg">{title}</div>
      <div className="text-foreground/75 text-balance text-sm">{subtitle}</div>
    </div>
  );
}

export default function ItemListPlaceholder({
  children,
  className,
  layout = "list",
  count = 10,
}: {
  children?: ReactNode;
  layout?: "list" | "grid";
  className?: string;
  count?: number;
}) {
  return (
    <div
      className={cn(
        "item-list-placeholder relative mx-auto flex w-full max-w-4xl select-none flex-col gap-2",
        className,
      )}>
      <div
        className={cn(
          "items-placeholder pointer-events-none flex flex-col [&]:[mask-image:var(--fade-gradient)]",
          {
            "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]": layout === "grid",
          },
        )}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            animate={{ opacity: 1 }}
            transition={{
              type: "tween",
              delay: 0.05 * i,
              duration: 0.5,
            }}
            initial={{ opacity: 0 }}
            key={i}
            className={cn(
              "group/item border-border-active bg-card text-card-foreground @container dark:border-border-active/50 flex min-h-12 w-full items-center gap-5 border border-dashed p-2 shadow transition-colors duration-200",
              {
                "first-of-type:rounded-t-lg last-of-type:rounded-b-lg": layout === "list",
                "f flex-col items-start first-of-type:rounded-l-lg last-of-type:rounded-r-lg":
                  layout === "grid",
              },
            )}>
            <div className="flex flex-shrink-0">
              <Favicon />
            </div>
            <span className="bg-foreground/10 h-3 w-full max-w-[30cqw] overflow-hidden text-ellipsis whitespace-nowrap rounded text-sm" />
            <span className="group/link bg-foreground/5 flex h-3 w-full max-w-[25cqw] items-center gap-2 rounded transition-colors duration-200" />
          </motion.div>
        ))}
      </div>
      {children}
    </div>
  );
}
