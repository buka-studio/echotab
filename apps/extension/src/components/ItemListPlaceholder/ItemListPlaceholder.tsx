import { cn } from "@echotab/ui/util";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import useGridLayoutInfo from "~/hooks/useGridLayoutInfo";
import usePatternBackground from "~/hooks/usePatternBackground";

import { Favicon } from "../TabItem";

export function ItemListPlaceholderCopy({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="absolute top-1/2 left-1/2 z-1 w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
      <div className="text-sm text-balance">{title}</div>
      <div className="text-muted-foreground text-sm text-balance">{subtitle}</div>
    </div>
  );
}

type PlaceholderVariant = "default" | "diagonal";

export default function ItemListPlaceholder({
  children,
  className,
  layout = "list",
  variant = "diagonal",
  count = 6,
}: {
  children?: ReactNode;
  layout?: "list" | "grid";
  className?: string;
  count?: number;
  variant?: PlaceholderVariant;
}) {
  const patternBg = usePatternBackground("diagonal_lines");
  const { gridRefCallback, edgeIndices } = useGridLayoutInfo(count);

  return (
    <div
      className={cn(
        "item-list-placeholder fade-gradient relative mx-auto flex w-full max-w-4xl flex-col gap-2 select-none",
        className,
      )}>
      <div
        ref={gridRefCallback}
        className={cn(
          "items-placeholder pointer-events-none flex flex-col mask-(--fade-gradient)",
          {
            "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]": layout === "grid",
          },
        )}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            style={{ backgroundImage: variant === "diagonal" ? patternBg : "" }}
            className={cn(
              "group/item border-border-active text-card-foreground dark:border-[color-mix(in_oklch,var(--border-active)_40%,var(--card))] @container flex min-h-12 w-full items-center border p-2 transition-colors duration-200",
              {
                "bg-card/40": variant === "default",
                "[&+&]:border-t-0": layout === "list",
                "f flex-col items-start [&+&]:border-l-0": layout === "grid",
                "*:opacity-0": variant === "diagonal",
                "rounded-tr-lg": i === edgeIndices.topRight,
                "rounded-tl-lg": i === edgeIndices.topLeft,
                "rounded-br-lg": i === edgeIndices.bottomRight,
                "rounded-bl-lg": i === edgeIndices.bottomLeft,
                "gap-5": layout === "list",
                "gap-2": layout === "grid",
              },
            )}>
            <div className="flex shrink-0">
              <Favicon className="*:from-muted-foreground/5 *:to-muted-foreground/5 shadow-none outline-0 outline-dashed" />
            </div>
            <span
              className={cn(
                "bg-muted-foreground/5 h-3 w-full overflow-hidden rounded text-sm text-ellipsis whitespace-nowrap",
                {
                  "max-w-[30cqw]": layout === "list",
                  "max-w-[50cqw]": layout === "grid",
                },
              )}
            />
            <span
              className={cn(
                "group/link bg-muted-foreground/5 flex h-3 w-full items-center gap-2 rounded transition-colors duration-200",
                {
                  "max-w-[25cqw]": layout === "list",
                  "max-w-[80cqw]": layout === "grid",
                },
              )}
            />
          </motion.div>
        ))}
      </div>
      {children}
    </div>
  );
}
