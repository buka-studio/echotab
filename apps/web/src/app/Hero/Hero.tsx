import { Badge } from "@echotab/ui/Badge";
import GlowOutline from "@echotab/ui/GlowOutline";
import { cn } from "@echotab/ui/util";
import { stagger, useAnimate } from "framer-motion";
import { useEffect, useState } from "react";

import TabItem from "../components/TabItem";
import { mockTabs } from "../constants";
import CommandMenu from "./CommandMenu";
import TabSwitch from "./TabSwitch";
import ThemeSwitch from "./ThemeSwitch";

const tabVariants = {
  base: {
    opacity: 0,
    transformPerspective: 1000,
    z: 100,
    scale: 1.1,
    filter: "blur(10px)",
  },
  active: { opacity: 1, z: 0, scale: 1, filter: "blur(0px)" },
};

const shadowVariants = {
  base: { filter: "blur(20px)", transformPerspective: 1000, y: -50, opacity: 0 },
  active: { filter: "blur(5px)", y: 0, opacity: 0.2 },
};

const windowVariants = {
  base: {
    opacity: 0,
    transformPerspective: 1000,
    y: 100,
    rotateX: 30,
    scale: 0.8,
    filter: "blur(5px)",
  },
  active: { opacity: 1, y: 0, rotateX: 0, scale: 1, filter: "blur(0px)" },
};

export default function Hero() {
  const [glow, setGlow] = useState(false);
  const [glowKey, setGlowKey] = useState(0);
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate([
      [".window", windowVariants.base],
      [".command-menu", tabVariants.base, { at: "<" }],
      [".herotab", tabVariants.base, { at: "<" }],
      [".herotab-shadow", shadowVariants.base, { at: "<" }],
      [
        ".window",
        windowVariants.active,
        {
          type: "spring",
          delay: 0.5,
          damping: 30,
          stiffness: 60,
          restDelta: 0.1,
        },
      ],
      [
        ".herotab",
        tabVariants.active,
        {
          at: "<",
          duration: 0.6,
          delay: stagger(0.1, {
            startDelay: 1,
          }),
        },
      ],
      [
        ".herotab-shadow",
        shadowVariants.active,
        {
          at: "<",
          duration: 0.5,
          delay: stagger(0.1, {
            startDelay: 1,
          }),
        },
      ],
      [".herotab-shadow", { opacity: 0 }],
      [
        ".command-menu",
        tabVariants.active,
        {
          type: "spring",
          at: "-0.5",
          damping: 30,
          stiffness: 100,
          // restDelta: 0.001,
        },
      ],
    ]).then(() => {
      setGlow(true);
    });
  }, [animate]);

  return (
    <div className={cn("hero relative")} ref={scope}>
      <div className="window border-border-active bg-background-base relative w-[min(1024px,90vw)] origin-[center_bottom] rounded-xl border pb-5 opacity-0 shadow-[0_4px_4px_1px_rgba(0,0,0,.10),0_0_0_8px_var(--secondary)] transform-3d">
        <div className="bg-background mb-10 w-full rounded-t-[11px] p-5 py-4">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-border-active h-2 w-2 rounded-full" />
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-5">
          <div className="mb-10 flex justify-between">
            <TabSwitch />
            <ThemeSwitch />
          </div>
          <div className="command-menu">
            <CommandMenu onClick={() => setGlowKey((k) => k + 1)} />
            {glow && <GlowOutline className="rounded-xl" width={2} key={glowKey} />}
          </div>
          <div className="herotabs border-border bg-surface-2 relative mx-auto flex max-w-[650px] flex-col rounded-xl border p-3">
            <div className="mb-3 flex items-center text-left text-sm">
              Window 1{" "}
              <Badge variant="card" className="ml-2">
                {mockTabs.length}
              </Badge>{" "}
            </div>
            <div className="relative">
              {mockTabs.map((tab, i) => (
                <div
                  key={i}
                  className="[&:first-child_.herotab]:rounded-t-lg [&:last-child_.herotab]:rounded-b-lg">
                  <div
                    className={cn(
                      "herotab-shadow bg-neutral-650 absolute right-0 left-0 mx-auto h-10 w-full rounded-lg",
                    )}
                  />
                  <TabItem tab={tab} className="herotab rounded-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
