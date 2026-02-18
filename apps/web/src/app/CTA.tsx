import { Button } from "@echotab/ui/Button";
import { CSSProperties } from "react";

import "./CTA.css";

import { useRelativeMousePositionPropertiesRef } from "@echotab/ui/hooks";

import { extensionStoreURL } from "./constants";

export default function CTA() {
  const ref = useRelativeMousePositionPropertiesRef<HTMLDivElement>({
    transform: (v) => String(v),
  });

  return (
    <div className="flex flex-col items-center">
      <div className="pulse-container relative" ref={ref}>
        <div className="square absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              className="circle circle-pulse border-muted-foreground/50 absolute aspect-square rounded-full border"
              style={
                {
                  "--pulse-delay": `${(i + 1) * 0.1}s`,
                  width: `calc(100% + ${i * 30}px)`,
                } as CSSProperties
              }
              key={i}
            />
          ))}
          <div className="bg-background relative flex aspect-square h-[150px] items-center justify-center rounded-3xl shadow-[0_4px_4px_1px_rgba(0,0,0,.1),0_0_0_10px_var(--border)]">
            <div className="mid bg-primary dark:shadow-primary/40 h-12 w-12 rounded-full border border-black/5 shadow-md shadow-black/30"></div>
          </div>
        </div>
      </div>
      <Button variant="default" size="lg" className="z-1 px-7 font-mono text-lg uppercase" asChild>
        <a href={extensionStoreURL} target="_blank" rel="noopener noreferrer">
          Add to Chrome
        </a>
      </Button>
    </div>
  );
}
