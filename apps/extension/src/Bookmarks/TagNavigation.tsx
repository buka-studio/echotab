import { cn } from "@echotab/ui/util";
import { Sparkle as SparkleIcon } from "@phosphor-icons/react";
import { LightningBoltIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";

import { Tag } from "../models";
import { useTagStore } from "../TagStore";
import { useBookmarkStore } from "./BookmarkStore";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
  show: (active: boolean) => ({
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    x: active ? -6 : 0,
    transition: {
      duration: 0.2,
    },
  }),
};

interface Props {
  visibleTagIds: Set<number>;
  onTagClick: ({ tag, index }: { tag: Tag; index: number }) => void;
  className?: string;
}

export default function TagNavigationLinks({ visibleTagIds, onTagClick, className }: Props) {
  const tagStore = useTagStore();
  const bookmarkStore = useBookmarkStore();
  const tags = bookmarkStore.viewTagIds.map((id) => tagStore.tags.get(id)!);

  return (
    // todo: implement skip navigation for keyboard users
    <motion.ul
      className={cn("flex flex-col gap-2 py-1 pl-2", className)}
      variants={container}
      initial="hidden"
      animate="show">
      <AnimatePresence mode="popLayout">
        {tags.map((tag, i) => {
          return (
            <motion.li
              variants={item}
              custom={visibleTagIds.has(tag.id)}
              layout
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              key={tag.id}
              className={cn(
                "text-foreground/50 text-sm leading-4 [.favorite_+_&:not(.favorite)]:mt-5",
                {
                  "text-foreground": visibleTagIds.has(tag.id),
                  favorite: tag.favorite,
                },
              )}>
              <button
                className="flex w-full select-none items-center gap-1 truncate rounded text-left focus-visible:underline focus-visible:outline-none"
                onClick={() => onTagClick({ tag, index: i })}>
                {tag.isQuick && (
                  <LightningBoltIcon className="text-muted-foreground mr-1 flex-shrink-0" />
                )}{" "}
                {tag.isAI && <SparkleIcon className="text-muted-foreground mr-1 flex-shrink-0" />}{" "}
                {tag?.name}
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
}
