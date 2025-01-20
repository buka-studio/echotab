"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export default function useRelativeMousePositionPropertiesRef<T extends HTMLElement>({
  fromCenter = false,
  transform = (v: number) => `${v}px`,
} = {}) {
  const ref = useRef<T>(null);

  const transformRef = useRef(transform);

  useLayoutEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    const handler = ({ clientX, clientY }: MouseEvent) => {
      const el = ref.current;

      if (!el) {
        return;
      }

      const bcr = el.getBoundingClientRect();
      let x = clientX - bcr.left;
      let y = clientY - bcr.top;

      if (fromCenter) {
        x -= bcr.width / 2;
        y -= bcr.height / 2;
      }

      el.style.setProperty(`--mouse-x`, transformRef?.current(x));
      el.style.setProperty(`--mouse-y`, transformRef?.current(y));
    };

    window.addEventListener("mousemove", handler, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
    };
  }, [fromCenter]);

  return ref;
}
