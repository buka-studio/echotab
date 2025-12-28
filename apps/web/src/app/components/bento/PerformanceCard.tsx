import { cn } from "@echotab/ui/util";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { CSSProperties, useRef } from "react";

import { mockTabs } from "../../constants";
import BentoCard from "./BentoCard";

import "./PerformanceCard.css";

import TabItem from "../TabItem";

const segments = 20;

export default function PerformanceCard({ className }: { className?: string }) {
  const count = useMotionValue(500);
  const roundedCount = useTransform(count, (latest) => {
    const v = Math.round(latest);
    return `${v >= 1000 ? 1000 : v}${v >= 1000 ? "+" : ""}`;
  });

  const hovering = useRef(false);
  const rotation = useSpring(0);

  useAnimationFrame(() => {
    if (hovering.current) {
      rotation.set(rotation.get() + 50);
    }
  });

  return (
    <BentoCard
      className={cn(className, "group")}
      onMouseEnter={() => {
        animate(count, 1000, {
          duration: 3.5,
          type: "tween",
          ease: [0.68, 0.43, 0, 1],
        });
        hovering.current = true;
      }}
      onMouseLeave={() => {
        hovering.current = false;
        setTimeout(() => {
          if (!hovering.current) {
            count.jump(300);
          }
        }, 300);
      }}
      illustration={
        <div className="relative h-full w-full">
          <motion.div className="counter absolute left-5 top-1/2 text-[28px] tracking-widest opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {roundedCount}
          </motion.div>
          <div className="cylinder-container">
            <motion.div
              style={{ rotateX: rotation, "--segments": segments } as CSSProperties}
              transition={{
                duration: 5,
                type: "spring",
              }}
              className="cylinder group">
              {Array.from({ length: segments }).map((_, i) => {
                const tab = mockTabs[i % mockTabs.length];
                return (
                  <div
                    key={i}
                    style={{ "--index": i } as CSSProperties}
                    className="segment select-none">
                    <TabItem
                      key={tab!.link}
                      tab={tab!}
                      className="transition-all duration-150 group-hover:blur-sm"
                    />
                  </div>
                );
              })}
            </motion.div>
          </div>
          <div className="overlay-mask pointer-events-none absolute inset-0" />
        </div>
      }>
      <div>
        <h3 className="text-foreground mb-2 flex items-center gap-2 font-mono text-sm uppercase">
          Clean and Performant
        </h3>
        <p className="text-muted-foreground text-balance text-left">
          Whether you have a few or several thousand tabs, enjoy smooth and efficient usability to
          power up your productivity.
        </p>
      </div>
    </BentoCard>
  );
}
