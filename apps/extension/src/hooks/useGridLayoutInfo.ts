import { useCallback, useLayoutEffect, useRef, useState } from "react";

function dynamicColCountFromGrid(row: Element) {
  const colCount = window
    .getComputedStyle(row)
    .getPropertyValue("grid-template-columns")
    .split(" ").length;

  return colCount;
}

function dynamicRowCountFromGrid(row: Element) {
  const rowCount = window
    .getComputedStyle(row)
    .getPropertyValue("grid-template-rows")
    .split(" ").length;

  return rowCount;
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

const defaultEdgeElements = {
  topLeft: 0,
  topRight: 0,
  bottomRight: 0,
  bottomLeft: 0,
};

export default function useGridLayoutInfo(itemCount: number) {
  const gridRef = useRef<HTMLElement>();
  const [placeholderCount, setPlaceholderCount] = useState(0);

  const [edgeIndices, setEdgeIndices] = useState(defaultEdgeElements);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const cols = dynamicColCountFromGrid(entry.target);
        const lastRowItems = itemCount % cols;
        setPlaceholderCount(lastRowItems === 0 ? 0 : itemCount ? cols - lastRowItems : cols);

        setEdgeIndices(getEdgeElements(entry.target));
      }
    });
    if (gridRef.current) {
      observer.observe(gridRef.current);
    }
  }, [itemCount]);

  const gridRefCallback = useCallback(
    (e: HTMLElement | null) => {
      if (!e) {
        return;
      }
      gridRef.current = e;
      const cols = dynamicColCountFromGrid(e);
      const lastRowItems = itemCount % cols;
      setPlaceholderCount(lastRowItems === 0 ? 0 : itemCount ? cols - lastRowItems : cols);
    },
    [itemCount],
  );

  return { gridRefCallback, placeholderCount, edgeIndices };
}
