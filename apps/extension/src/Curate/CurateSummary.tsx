import { NumberFlow } from "@echotab/ui/NumberFlow";
import { cn } from "@echotab/ui/util";
import { TagIcon, TrashIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { CSSProperties } from "react";

import { PCVisual } from "./PCVisual";
import { ChristmasTreeIllustration } from "./PCVisual/illustrations";

interface Props {
  deleted: number;
  kept: number;
  className?: string;
  children?: React.ReactNode;
  empty?: boolean;
}

export default function CurateSummary({ deleted, kept, className, children, empty }: Props) {
  return (
    <div
      className={cn(
        "text-muted flex flex-col items-center justify-center gap-2 text-base",
        className,
      )}>
      <PCVisual
        illustration={
          <g className="translate-x-[145px] translate-y-[80px] scale-85 skew-x-[6deg] skew-y-[-3deg]">
            <ChristmasTreeIllustration
              style={
                {
                  "--tree": "var(--card-active)",
                  "--tree-light": "var(--muted-foreground)",
                } as CSSProperties
              }
            />
          </g>
        }
        style={
          {
            "--screen": "var(--background-base)",
            "--edges": "color-mix(in srgb, var(--muted-foreground) 30%, transparent)",
            "--case": "var(--card)",
            "--splash": "var(--surface-2)",
            "--visual": "var(--foreground)",
          } as CSSProperties
        }
      />
      <motion.h1
        className="text-foreground mt-5"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}>
        {empty
          ? "No bookmarks to curate today, come back tomorrow!"
          : `You curated ${kept + deleted} bookmarks today, nice job!`}
      </motion.h1>
      {!empty && (
        <>
          <motion.div
            className="text-muted-foreground/50 flex items-center gap-3"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}>
            <span className="text-muted-foreground flex items-center gap-1">
              <NumberFlow value={deleted} /> deleted{" "}
              <TrashIcon className="text-muted-foreground h-4 w-4" />
            </span>
            /
            <span className="text-muted-foreground flex items-center gap-1">
              <NumberFlow value={kept} /> kept <TagIcon className="text-muted-foreground h-4 w-4" />
            </span>
          </motion.div>
        </>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: 0.25 }}>
        {children}
      </motion.div>
    </div>
  );
}
