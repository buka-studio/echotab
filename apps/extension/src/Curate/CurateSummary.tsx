import { NumberFlow } from "@echotab/ui/NumberFlow";
import { cn } from "@echotab/ui/util";
import { Tag as TagIcon, Trash as TrashIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { CSSProperties } from "react";

import PCVisual from "./PCVisual";

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
        style={
          {
            "--screen": "var(--card-active)",
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
          ? "No tabs to curate today, come back tomorrow!"
          : `You organized ${kept + deleted} links today, nice job!`}
      </motion.h1>
      {!empty && (
        <>
          <motion.div
            className="flex items-center gap-2"
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
