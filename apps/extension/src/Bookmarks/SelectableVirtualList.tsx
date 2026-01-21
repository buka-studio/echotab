import { cn } from "@echotab/ui/util";
import { useWindowVirtualizer, VirtualItem, Virtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { Ref, useCallback, useImperativeHandle, useRef } from "react";

import { SelectableItem } from "../components/SelectableList";
import { focusSiblingItem } from "../util/dom";

interface Props {
  children(i: VirtualItem): React.ReactNode;
  className?: string;
  items: string[];
  ref: Ref<{ virtualizer: Virtualizer<Window, Element> }>;
}

function SelectableVirtualList({ items, children, className, ref }: Props) {
  const listRef = useRef<HTMLUListElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: useCallback(() => 50, []),
    overscan: 0,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  useImperativeHandle(ref, () => ({
    virtualizer,
  }));

  return (
    <ul
      className={cn(className)}
      ref={listRef}
      onKeyDown={(e) => focusSiblingItem(e, ".item-container")}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        position: "relative",
      }}>
      {virtualizer.getVirtualItems().map((i) => {
        const item = items[i.index];

        if (!item) {
          return null;
        }

        return (
          <SelectableItem asChild id={item} key={item}>
            <motion.li
              animate={{ opacity: 1 }}
              transition={{
                type: "tween",
                delay: 0.01,
                duration: 0.1,
              }}
              initial={{ opacity: 0 }}
              data-index={i.index}
              className={cn(
                "item-container @container absolute top-0 mt-px w-full select-none hover:z-1 [&:first-child>*]:rounded-t-lg [&:has(+.tag-group)>*]:rounded-b-lg [&:last-child>*]:rounded-b-lg [.tag-group+&>*]:rounded-t-lg",
                "[.light_&+&>*]:border-t-transparent",
                "[.dark_&:is(:hover,:focus-within,[data-selected=true],:has([data-selected=true]))+&:is(:hover,:focus-within,[data-selected=true],:has([data-selected=true]))>*]:border-t-transparent",
              )}
              style={{
                transform: `translateY(${i.start - virtualizer.options.scrollMargin}px)`,
              }}
              ref={virtualizer.measureElement}>
              {children(i)}
            </motion.li>
          </SelectableItem>
        );
      })}
    </ul>
  );
}

export default SelectableVirtualList;
