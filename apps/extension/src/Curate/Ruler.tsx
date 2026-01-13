import { cn } from "@echotab/ui/util";
import { motion } from "framer-motion";
import { CSSProperties, useEffect, useId, useState } from "react";

import { clamp, remap } from "../util/math";

function useViewportSize() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { width, height };
}

export default function Ruler({
  value = 10,
  stepSize = 10,
  className,
  side = "left",
  children,
}: {
  value: number;
  stepSize?: number;
  className?: string;
  side?: "left" | "right";
  children?: React.ReactNode;
}) {
  const { width, height } = useViewportSize();
  const id = useId();

  // round to the nearest 10
  const steps = Math.floor((height - 40) / stepSize / 10) * 10;

  const isLeft = side === "left";
  const isRight = side === "right";

  return (
    <div
      className={cn(
        "ruler dark:border-muted border-border-active pointer-events-none fixed top-1/2 left-0 z-100 h-[calc(var(--step-size)*var(--steps)*1px)] -translate-y-1/2",
        {
          "left-2 border-l-2": isLeft,
          "right-2 border-r-2": isRight,
        },
        className,
      )}
      style={{ "--step-size": stepSize, "--steps": steps } as CSSProperties}>
      {Array.from({ length: steps + 1 }, (_, i) => i).map((i) => {
        const isValue = Math.round(clamp(remap(value, 0, steps, steps, 0), 0, steps)) === i;

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: remap(i, 0, steps, steps, 0) * 0.01 }}
            key={i}
            style={{ "--offset": i * stepSize } as CSSProperties}
            className={cn(
              "ruler-step dark:outline-muted outline-border-active absolute top-[calc(var(--offset)*1px)] w-1 outline",
              {
                "w-3": i % 5 === 0,
                "w-5": i % 10 === 0,
                "left-0": isLeft,
                "right-0": isRight,
              },
            )}>
            {isValue && (
              <motion.div
                layoutId={`ruler-value-${id}`}
                className={cn("outline-border absolute top-0 w-[100px] outline-1 outline-dashed", {
                  "left-0": isLeft,
                  "right-0": isRight,
                })}>
                <div
                  className={cn("absolute top-1/2 -translate-y-1/2", {
                    "right-0": isLeft,
                    "left-0": isRight,
                  })}>
                  {children}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
