import { cn } from "@echotab/ui/util";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";

import { useUIStore } from "../UIStore";

const dynamicColCountFromGrid = (row: Element) => {
  const colCount = window
    .getComputedStyle(row)
    .getPropertyValue("grid-template-columns")
    .split(" ").length;

  return colCount;
};

const dynamicRowCountFromGrid = (row: Element) => {
  const rowCount = window
    .getComputedStyle(row)
    .getPropertyValue("grid-template-rows")
    .split(" ").length;

  return rowCount;
};

const defaultEdgeElements = {
  topLeft: 0,
  topRight: 0,
  bottomRight: 0,
  bottomLeft: 0,
};

// src https://github.com/yoksel/url-encoder
const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
function encodeSVG(svg: string) {
  // Use single quotes instead of double to avoid encoding.

  svg = svg.replace(/>\s{1,}</g, `><`);
  svg = svg.replace(/\s{2,}/g, ` `);

  // Using encodeURIComponent() as replacement function
  // allows to keep result code readable
  return svg.replace(symbols, encodeURIComponent);
}

function getEdgeElements(grid?: Element) {
  if (!grid) {
    return defaultEdgeElements;
  }
  const edgeElements = grid.children;
  return {
    topLeft: 0,
    topRight: dynamicColCountFromGrid(grid) - 1,
    bottomRight: edgeElements.length - 1,
    bottomLeft: edgeElements.length - dynamicColCountFromGrid(grid),
  };
}

function PlaceholderItem({ className = "" }) {
  useUIStore();

  const isDarkTheme = document.documentElement.classList.contains("dark");

  const linesPatternBg =
    "data:image/svg+xml," +
    encodeSVG(`<svg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'>
            <g fill='hsl(${window.getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground")})' fill-opacity=${isDarkTheme ? "'0.15'" : "'0.25'"} fill-rule='evenodd'>
                <path d='M5 0h1L0 6V5zM6 5v1H5z' />
            </g>
        </svg>`);

  return (
    <div
      style={{ backgroundImage: `url("${linesPatternBg}")` }}
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
  const gridRef = useRef<HTMLDivElement>();
  const [placeholderCount, setPlaceholderCount] = useState(0);

  const [edgeIndices, setEdgeIndices] = useState(defaultEdgeElements);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const cols = dynamicColCountFromGrid(entry.target);
        const lastRowItems = items.length % cols;
        setPlaceholderCount(lastRowItems === 0 ? 0 : items.length ? cols - lastRowItems : cols);

        setEdgeIndices(getEdgeElements(entry.target));
      }
    });
    if (gridRef.current) {
      observer.observe(gridRef.current);
    }
  }, [items.length]);

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] [&>*]:ml-[-1px] [&>*]:mt-[-1px]"
      ref={(e) => {
        if (!e) {
          return;
        }
        gridRef.current = e;
        const cols = dynamicColCountFromGrid(e);
        const lastRowItems = items.length % cols;
        setPlaceholderCount(lastRowItems === 0 ? 0 : items.length ? cols - lastRowItems : cols);
      }}>
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
