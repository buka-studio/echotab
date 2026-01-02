"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { CSSProperties, RefObject, useEffect, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";

import { cn } from "./util";

const updateScrollOffsets = (viewport: HTMLElement | null, root: HTMLElement | null) => {
  if (!viewport || !root) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = viewport;
  const top = scrollTop;
  const bottom = scrollHeight > clientHeight ? scrollHeight - clientHeight - scrollTop : 0;

  root.style.setProperty("--offset-y-top", `${top}`);
  root.style.setProperty("--offset-y-bottom", `${bottom}`);
};

function ScrollArea({
  className,
  viewportClassName,
  children,
  fade,
  maskOffset = 20,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  fade?: "mask" | "shadow";
  maskOffset?: number;
  viewportClassName?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useResizeObserver({
    ref: viewportRef as RefObject<HTMLElement>,
    onResize: () => updateScrollOffsets(viewportRef.current, rootRef.current),
  });

  useEffect(() => {
    updateScrollOffsets(viewportRef.current, rootRef.current);
  }, []);

  return (
    <ScrollAreaPrimitive.Root
      ref={rootRef}
      data-slot="scroll-area"
      className={cn(
        "group/scroll-area relative",
        {
          "before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-0 before:z-10 before:h-8 before:bg-linear-to-b before:from-black/10 before:to-transparent before:opacity-[min(1,calc(var(--offset-y-top)/20))] before:transition-opacity before:duration-150 dark:before:from-black/20":
            fade === "shadow",
          "after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-0 after:z-10 after:h-8 after:bg-linear-to-t after:from-black/10 after:to-transparent after:opacity-[min(1,calc(var(--offset-y-bottom)/20))] after:transition-opacity after:duration-150 dark:after:from-black/20":
            fade === "shadow",
        },
        className,
      )}
      {...props}>
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        onScroll={(e) => {
          updateScrollOffsets(e.currentTarget, rootRef.current);
        }}
        data-slot="scroll-area-viewport"
        style={
          {
            "--mask-offset": `${maskOffset}%`,
          } as CSSProperties
        }
        className={cn(
          "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&>div]:block!",
          {
            "mask-[linear-gradient(to_bottom,transparent,black_min(var(--offset-y-top)*1px,var(--mask-offset)),black_calc(100%-min(var(--offset-y-bottom)*1px,var(--mask-offset))),transparent)]":
              fade === "mask",
          },
          viewportClassName,
        )}>
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        {
          "h-full w-2.5 border-l border-l-transparent": orientation === "vertical",
          "h-2.5 flex-col border-t border-t-transparent": orientation === "horizontal",
        },
        className,
      )}
      {...props}>
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-[#c1c1c1] hover:bg-neutral-500 dark:bg-neutral-700 dark:hover:bg-neutral-600"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
