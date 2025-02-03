import { useCallback, useRef, useState } from "react";

export default function useDimensionsRef() {
  const [dimensions, setDimensions] = useState<{ width: number | null; height: number | null }>({
    width: null,
    height: null,
  });

  const resizeObserver = useRef<ResizeObserver | null>(null);

  const observerRef = useCallback((node: HTMLElement | null) => {
    if (resizeObserver.current) {
      resizeObserver.current.disconnect();
      resizeObserver.current = null;
    }

    if (node?.nodeType === Node.ELEMENT_NODE) {
      const observer = new ResizeObserver(([entry]) => {
        if (entry && entry.borderBoxSize) {
          const { inlineSize: width, blockSize: height } = entry.borderBoxSize[0]!;

          setDimensions({ width, height });
        }
      });

      observer.observe(node);
      resizeObserver.current = observer;
    }
  }, []);

  return { observerRef, dimensions };
}
