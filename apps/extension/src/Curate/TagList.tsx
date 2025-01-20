import { AnimatePresence, motion } from "framer-motion";

import TagChip from "~/src/components/tag/TagChip";
import { useTagStore } from "~/src/TagStore";

import "./CurateDialog.css";

import { BookmarkStore } from "../Bookmarks";
import TagChipCombobox from "../components/tag/TagChipCombobox";

export default function TagList({ tagIds, tabId }: { tagIds: number[]; tabId: string }) {
  const tagStore = useTagStore();

  const tags = Array.from(tagStore.tags.values()).filter((tag) => tagIds.includes(tag.id));

  const handleSetTags = (tagIds: number[]) => {
    BookmarkStore.tagTabs([tabId], tagIds, true);
  };

  return (
    <motion.ul className="flex flex-wrap gap-2" layout>
      <AnimatePresence mode="wait">
        {tagIds.map((id, i) => {
          const tag = tagStore.tags.get(id);
          return (
            <motion.div
              key={id + "_" + tabId}
              initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              transition={{ delay: 0.1 * i, duration: 0.1 }}>
              <TagChip color={tag?.color}>{tag!.name}</TagChip>
            </motion.div>
          );
        })}
        {tagIds.length > 0 && (
          <motion.div
            key={`add_tag_${tabId}`}
            initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
            transition={{ delay: 0.1 * tags.length, duration: 0.1 }}>
            <TagChipCombobox
              trigger={
                <button className="focus-within:text-foreground focus-within:outline-none">
                  <TagChip className="border-dashed">Add new tag</TagChip>
                </button>
              }
              tags={tags}
              onSetTags={handleSetTags}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.ul>
  );
}
