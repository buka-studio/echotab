import { AnimatePresence, motion } from "framer-motion";

import TagChip from "~/src/components/tag/TagChip";
import { useTagStore } from "~/src/TagStore";

import { BookmarkStore } from "../Bookmarks";
import TagChipCombobox from "../components/tag/TagChipCombobox";

export default function TagList({ tagIds, tabId }: { tagIds: number[]; tabId: string }) {
  const tagStore = useTagStore();

  const tags = Array.from(tagStore.tags.values()).filter((tag) => tagIds.includes(tag.id));

  const handleSetTags = (tagIds: number[]) => {
    BookmarkStore.tagTabs([tabId], tagIds, true);
  };

  return (
    <motion.ul className="scrollbar-gray flex max-w-[80vw] flex-nowrap gap-2" layoutScroll>
      <AnimatePresence mode="popLayout">
        {tagIds.map((id, i) => {
          const tag = tagStore.tags.get(id);
          return (
            <motion.div
              layout
              key={id}
              initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.1, delay: 0.05 * i },
              }}
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}>
              <TagChip color={tag?.color}>{tag!.name}</TagChip>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <motion.div layout key="add_tag">
        <TagChipCombobox
          trigger={
            <button className="focus-within:text-foreground focus-within:outline-none">
              <TagChip className="border-dashed">Edit tags</TagChip>
            </button>
          }
          tags={tags}
          onSetTags={handleSetTags}
        />
      </motion.div>
    </motion.ul>
  );
}
