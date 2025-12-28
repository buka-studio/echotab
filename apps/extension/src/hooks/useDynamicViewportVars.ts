import { useLayoutEffect } from "react";

import { getRootElement } from "../util/dom";

const listenerOptions = {
  passive: true,
};

export function updateViewport() {
  const vh = window.innerHeight * 0.01;
  const vw = window.innerWidth * 0.01;

  const root = getRootElement();

  root.style.setProperty("--dvh", `${vh}px`);
  root.style.setProperty("--dvw", `${vw}px`);
}

export function getDynamicViewportVars() {
  const root = getRootElement();
  const style = getComputedStyle(root);
  return {
    dvh: style.getPropertyValue("--dvh").slice(0, -2),
    dvw: style.getPropertyValue("--dvw").slice(0, -2),
  };
}

export default function useDynamicViewport(): void {
  useLayoutEffect(() => {
    updateViewport();

    window.addEventListener("resize", updateViewport, listenerOptions);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);
}

export function DynamicViewportVarsSetter() {
  useDynamicViewport();
  return null;
}

export const dvh100 = `calc(var(--dvh, 1vh) * 99.99)`;
export const dvw100 = `calc(var(--dvw, 1vh) * 99.99)`;
