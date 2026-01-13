import { cn } from "@echotab/ui/util";
import { SparkleIcon } from "@phosphor-icons/react";
import { LightningBoltIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";

import { Tag } from "../models";
import { useViewTagIds } from "../store/bookmarkStore";
import { useTagsById } from "../store/tagStore";

interface Props {
  visibleTagIds: Set<number>;
  onTagClick: ({ tag, index }: { tag: Tag; index: number }) => void;
  className?: string;
}

export default function TagNavigationLinks({ visibleTagIds, onTagClick, className }: Props) {
  const tagsById = useTagsById();
  const viewTagIds = useViewTagIds();
  const tags = viewTagIds.map((id) => tagsById.get(id)!);

  return (
    // todo: implement skip navigation for keyboard users
    <motion.ul className={cn("flex flex-col gap-2 py-1 pb-3 pl-2", className)}>
      <AnimatePresence mode="popLayout">
        {tags.map((tag, i) => {
          const active = visibleTagIds.has(tag.id);
          return (
            <motion.li
              layout="position"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                x: active ? -6 : 0,
                transition: { x: { duration: 0.1 }, opacity: { duration: 0.1, delay: 0.01 * i } },
              }}
              exit={{ opacity: 0 }}
              key={tag.id}
              className={cn(
                "text-foreground/50 text-sm leading-4 [.favorite+&:not(.favorite)]:mt-5",
                {
                  "text-foreground": visibleTagIds.has(tag.id),
                  favorite: tag.favorite,
                  ai: tag.isAI,
                  quick: tag.isQuick,
                },
              )}>
              <button
                className="flex w-full items-center gap-1 truncate rounded text-left select-none focus-visible:underline focus-visible:outline-none"
                onClick={() => onTagClick({ tag, index: i })}>
                {tag.isQuick && (
                  <LightningBoltIcon className="text-muted-foreground mr-1 shrink-0" />
                )}{" "}
                {tag.isAI && <SparkleIcon className="text-muted-foreground mr-1 shrink-0" />}{" "}
                {tag?.name}
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
}
