import { cn } from "@echotab/ui/util";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import useGridLayoutInfo from "~/hooks/useGridLayoutInfo";
import usePatternBackground from "~/hooks/usePatternBackground";

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
    <div className="absolute top-1/2 left-1/2 z-1 w-full translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
      <div className="text-sm text-balance">{title}</div>
      <div className="text-muted-foreground text-sm text-balance">{subtitle}</div>
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
  const patternBg = usePatternBackground("diagonal_lines");
  const { gridRefCallback, edgeIndices } = useGridLayoutInfo(count);

  return (
    <div
      className={cn(
        "item-list-placeholder relative mx-auto flex w-full max-w-4xl flex-col gap-2 select-none",
        className,
      )}>
      <div
        ref={gridRefCallback}
        className={cn(
          "items-placeholder pointer-events-none flex flex-col [&]:[mask-image:var(--fade-gradient)]",
          {
            "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]": layout === "grid",
          },
        )}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            // animate={{ opacity: 1 }}
            transition={{
              // type: "tween",
              delay: 0.05 * i,
              duration: 0.25,
            }}
            // initial={{ opacity: 0 }}
            key={i}
            style={{ backgroundImage: layout === "grid" ? patternBg : "" }}
            className={cn(
              "group/item border-border-active text-card-foreground dark:border-border-active/50 @container flex min-h-12 w-full items-center gap-5 border p-2 transition-colors duration-200",
              {
                "[&+&]:border-t-0": layout === "list",
                "f flex-col items-start [&+&]:border-l-0 [&>*]:opacity-0": layout === "grid",
                "rounded-tr-lg": i === edgeIndices.topRight,
                "rounded-tl-lg": i === edgeIndices.topLeft,
                "rounded-br-lg": i === edgeIndices.bottomRight,
                "rounded-bl-lg": i === edgeIndices.bottomLeft,
              },
            )}>
            <div className="flex flex-shrink-0">
              <Favicon className="[&>*]:from-muted-foreground/5 [&>*]:to-muted-foreground/5 shadow-none outline-0 outline-dashed" />
            </div>
            <span className="bg-muted-foreground/5 h-3 w-full max-w-[30cqw] overflow-hidden rounded text-sm text-ellipsis whitespace-nowrap" />
            <span className="group/link bg-muted-foreground/5 flex h-3 w-full max-w-[25cqw] items-center gap-2 rounded transition-colors duration-200" />
          </motion.div>
        ))}
      </div>
      {children}
    </div>
  );
}
