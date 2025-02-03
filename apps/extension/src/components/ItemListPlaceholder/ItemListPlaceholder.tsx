import { cn } from "@echotab/ui/util";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import useGridLayoutInfo from "~/src/hooks/useGridLayoutInfo";
import usePatternBackground from "~/src/hooks/usePatternBackground";

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
      <div className="text-balance text-sm">{title}</div>
      <div className="text-muted-foreground text-balance text-sm">{subtitle}</div>
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
        "item-list-placeholder relative mx-auto flex w-full max-w-4xl select-none flex-col gap-2",
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
            animate={{ opacity: 1 }}
            transition={{
              type: "tween",
              delay: 0.05 * i,
              duration: 0.5,
            }}
            initial={{ opacity: 0 }}
            key={i}
            style={{ backgroundImage: layout === "grid" ? patternBg : "" }}
            className={cn(
              "group/item border-border-active text-card-foreground @container dark:border-border-active/50 flex min-h-12 w-full items-center gap-5 border p-2 transition-colors duration-200",
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
              <Favicon className="[&>*]:from-muted-foreground/5 [&>*]:to-muted-foreground/5 shadow-none outline-dashed outline-0" />
            </div>
            <span className="bg-muted-foreground/5 h-3 w-full max-w-[30cqw] overflow-hidden text-ellipsis whitespace-nowrap rounded text-sm" />
            <span className="group/link bg-muted-foreground/5 flex h-3 w-full max-w-[25cqw] items-center gap-2 rounded transition-colors duration-200" />
          </motion.div>
        ))}
      </div>
      {children}
    </div>
  );
}
