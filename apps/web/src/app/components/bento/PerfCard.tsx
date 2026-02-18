"use client";

import {
  animate,
  motion,
  MotionValue,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { CSSProperties, useEffect, useRef, useState } from "react";

import { mockTabs } from "../../constants";

import "./PerfCard.css";

import { cn } from "@echotab/ui/util";
import NumberFlow from "@number-flow/react";

import { getIsSafari } from "../../util";
import TabItem from "../TabItem";
import BentoCard from "./BentoCard";

const segments = 20;

const Counter = ({ count }: { count: MotionValue<number> }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const unsubscribe = count.onChange((latest) => {
      setValue(latest);
    });
    return () => unsubscribe();
  }, [count]);

  return (
    <NumberFlow value={value} suffix={value >= 1000 ? "+" : ""} className="text-muted-foreground" />
  );
};

export default function PerformanceCard({ className }: { className?: string }) {
  const [isSafari, setIsSafari] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    setIsSafari(getIsSafari());
  }, []);

  const count = useMotionValue(100);
  const roundedCount = useTransform(count, Math.round);

  const hovering = useRef(false);
  const rotation = useSpring(0, {
    bounce: 0.35,
  });
  const rotationSpeed = useRef(0);

  useAnimationFrame(() => {
    if (hovering.current) {
      rotation.set(rotation.get() + 50 + rotationSpeed.current);
      rotationSpeed.current = Math.min(rotationSpeed.current + 1, 70);
    }
  });

  const stdDevY = useMotionValue(0);
  const stdDevX = useMotionValue(0);
  const stdDeviation = useMotionTemplate`${stdDevX},${stdDevY}`;
  const cssBlurPx = useTransform(stdDevY, [0, 25], [0, 4]);
  const cssBlur = useMotionTemplate`blur(${cssBlurPx}px)`;

  const [showCount, setShowCount] = useState(false);

  const handleRun = () => {
    setShowCount(true);
    rotationSpeed.current = 0;
    animate(count, 1000, {
      duration: 3,
      type: "tween",
    });
    hovering.current = true;
    animate(stdDevY, 25, {
      duration: 2,
      type: "tween",
    });
  };

  const handleStop = () => {
    setShowCount(false);
    hovering.current = false;
    rotationSpeed.current = 0;
    setTimeout(() => {
      if (!hovering.current) {
        count.jump(100);
      }
    }, 300);
    animate(stdDevY, 0, {
      duration: 0.1,
      type: "tween",
    });
  };

  return (
    <BentoCard
      className={cn(className, "group select-none", {})}
      onTouchStart={handleRun}
      onTouchEnd={handleStop}
      onMouseEnter={handleRun}
      onMouseLeave={handleStop}
      illustration={
        <div className="relative h-full w-full">
          <motion.div
            className={cn(
              "counter absolute top-1/2 left-5 min-w-[85px] text-[28px] tracking-widest opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              {
                "opacity-100": showCount,
              },
            )}>
            <div className="absolute right-0">
              <Counter count={roundedCount} />
            </div>
          </motion.div>

          <div
            className={cn(
              "cylinder-container relative h-full transform-gpu overflow-clip transform-3d",
            )}>
            <motion.div
              style={{ rotateX: rotation, "--segments": segments } as CSSProperties}
              className={cn("cylinder group", {})}>
              {Array.from({ length: segments }).map((_, i) => {
                const tab = mockTabs[i % mockTabs.length];
                if (!tab) return null;
                return (
                  <div
                    key={i}
                    style={{ "--index": i } as CSSProperties}
                    className={cn("segment select-none", {})}>
                    <TabItem
                      key={tab.link}
                      tab={tab}
                      className={cn("transform-gpu transition-all duration-150", {
                        "opacity-0": isSafari === undefined,
                      })}
                      style={
                        isSafari === undefined
                          ? undefined
                          : { filter: isSafari ? cssBlur : "url(#blur)" }
                      }
                    />
                  </div>
                );
              })}
            </motion.div>
          </div>
          <div className={cn("overlay-mask pointer-events-none absolute inset-0")} />
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="filters">
            <defs>
              <filter id="blur">
                <motion.feGaussianBlur in="SourceGraphic" stdDeviation={stdDeviation} />
              </filter>
            </defs>
          </svg>
        </div>
      }>
      <div>
        <h3 className="text-foreground mb-2 flex items-center gap-2 font-mono text-sm uppercase">
          Fast & Smooth
        </h3>
        <p className="text-muted-foreground text-left text-balance">
          Handle hundreds of tabs with ease.
          <br />
          Search and organize your bookmarks in an instant.
        </p>
      </div>
    </BentoCard>
  );
}
