import { cn } from "@echotab/ui/util";
import { ComponentProps } from "react";

import useResizeRef from "../../hooks/useResizeRef";
import Warp, { GenieTarget } from "./Warp";

type Subscribable = { on: (event: "change", cb: (v: number) => void) => () => void };

export function GenieTabs({
  targets,
  onUpdate,
  className,
  ...props
}: {
  targets: GenieTarget[];
  onUpdate?: Subscribable;
  className?: string;
} & Omit<ComponentProps<"div">, "children">) {
  const { ref: containerRef, dimensions } = useResizeRef<HTMLDivElement>();

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0", className)}
      {...props}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Warp
          targets={targets}
          onUpdate={onUpdate}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        />
      )}
    </div>
  );
}
