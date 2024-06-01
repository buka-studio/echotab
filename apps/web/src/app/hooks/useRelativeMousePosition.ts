"use client";

import { useEffect, useRef } from "react";

export default function useRelativeMousePosition<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const handler = ({ clientX, clientY }: MouseEvent) => {
            const el = ref.current;

            if (!el) {
                return;
            }

            const bcr = el.getBoundingClientRect();
            const x = clientX - bcr.left;
            const y = clientY - bcr.top;

            el.style.setProperty(`--mouse-x`, `${x}px`);
            el.style.setProperty(`--mouse-y`, `${y}px`);
        };

        window.addEventListener("mousemove", handler, { passive: true });
        return () => {
            window.removeEventListener("mousemove", handler);
        };
    }, []);

    return ref;
}
