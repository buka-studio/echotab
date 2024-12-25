import { cn } from "@echotab/ui/util";
import { ReactNode } from "react";

import useGridLayoutInfo from "../hooks/useGridLayoutInfo";
import usePatternBackground from "../hooks/usePatternBackground";

function PlaceholderItem({ className = "" }) {
  const patternBg = usePatternBackground("diagonal_lines");

  return (
    <div
      style={{ backgroundImage: patternBg }}
      className={cn(
        "bg-surface-1 flex items-center justify-center border border-dashed",
        className,
      )}
    />
  );
}

interface Props<T> {
  items: T[];
  children: (props: { item: T; index: number }) => React.ReactNode;
  label?: ReactNode;
}

export default function ItemGrid<T extends string | number>({ items, children }: Props<T>) {
  const { gridRefCallback, edgeIndices, placeholderCount } = useGridLayoutInfo(items.length);

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] [&>*]:ml-[-1px] [&>*]:mt-[-1px]"
      ref={gridRefCallback}>
      {items.map((item, i) => (
        <div
          className={cn("@container relative focus-within:z-[1] hover:z-[1]", {
            "[&>*]:rounded-tr-lg": i === edgeIndices.topRight,
            "[&>*]:rounded-tl-lg": i === edgeIndices.topLeft,
            "[&>*]:rounded-br-lg": i === edgeIndices.bottomRight,
            "[&>*]:rounded-bl-lg": i === edgeIndices.bottomLeft,
          })}
          key={item}>
          {children({ item, index: i })}
        </div>
      ))}
      {Array.from({ length: placeholderCount }).map((_, i) => {
        const totalIndex = items.length + i;
        return (
          <PlaceholderItem
            className={cn({
              "rounded-tr-lg": totalIndex === edgeIndices.topRight,
              "rounded-tl-lg": totalIndex === edgeIndices.topLeft,
              "rounded-br-lg": totalIndex === edgeIndices.bottomRight,
              "rounded-bl-lg": totalIndex === edgeIndices.bottomLeft,
            })}
            key={i}
          />
        );
      })}
    </div>
  );
}
