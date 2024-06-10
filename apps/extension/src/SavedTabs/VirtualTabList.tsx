import { useWindowVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { Tag } from "../models";
import { SelectableItem } from "../SelectableList";
import { focusSiblingItem } from "../util";
import { useSavedTabStore } from "./SavedStore";
import SavedTabItem from "./SavedTabItem";

interface Props {
    tag?: Tag;
    items: string[];
}

interface Ref {
    virtualizer: Virtualizer<Window, Element>;
}

const VirtualTabList = forwardRef<Ref, Props>(function VirtualTabList({ items, tag }, ref) {
    const tabStore = useSavedTabStore();
    const listRef = useRef<HTMLUListElement>(null);

    const virtualizer = useWindowVirtualizer({
        count: items.length,
        estimateSize: () => 54,
        overscan: 0,
        scrollMargin: listRef.current?.offsetTop ?? 0,
    });

    useImperativeHandle(ref, () => ({
        virtualizer,
    }));

    return (
        <ul
            ref={listRef}
            onKeyDown={(e) => focusSiblingItem(e, ".item-container")}
            style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: "relative",
            }}>
            {virtualizer.getVirtualItems().map((i) => {
                const item = items[i.index];

                const tab = tabStore.viewTabsById[item];

                return (
                    <SelectableItem asChild id={tab.id} key={i.key}>
                        <motion.li
                            animate={{ opacity: 1 }}
                            transition={{
                                type: "tween",
                                delay: 0.01,
                                duration: 0.25,
                            }}
                            initial={{ opacity: 0 }}
                            data-index={i.index}
                            className="item-container @container absolute top-0 mt-[-1px] w-full select-none hover:z-[1] [&+&:not(:is(:hover,:focus-within,[data-selected]))_.tab-item]:border-t-transparent [&:first-child_.tab-item]:rounded-t-lg [&:has(+.tag-group)_.tab-item]:rounded-b-lg [&:last-child_.tab-item]:rounded-b-lg [.tag-group+&_.tab-item]:rounded-t-lg"
                            style={{
                                transform: `translateY(${
                                    i.start - virtualizer.options.scrollMargin
                                }px)`,
                            }}
                            ref={virtualizer.measureElement}>
                            <SavedTabItem tab={tab} currentGroupTagId={tag?.id} />
                        </motion.li>
                    </SelectableItem>
                );
            })}
        </ul>
    );
});
// [&+&:not(:has(:hover,:focus-within,[data-selected]))_.tab-item]:border-t-transparent
export default VirtualTabList;
