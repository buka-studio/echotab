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
          stiffness: 50,
          restDelta: 0.2,
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
          //   restDelta: 0.001,
        },
      ],
    ]).then(() => {
      setGlow(true);
    });
  }, [animate]);

  return (
    <div className={cn("hero relative")} ref={scope}>
      <div className="window border-border relative w-[min(1024px,90vw)] rounded-xl border p-5 opacity-0 shadow-[0_4px_4px_1px_rgba(0,0,0,.10),0_0_0_10px_hsl(var(--border))] [transform-origin:center_bottom] [transform-style:preserve-3d]">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 flex justify-between">
            <TabSwitch />
            <ThemeSwitch />
          </div>
          <div className="command-menu">
            <CommandMenu />
            {glow && <GlowOutline className="rounded-xl" width={2} />}
          </div>
          <div className="herotabs border-border bg-surface-1 relative mx-auto flex max-w-[650px] flex-col rounded-xl border p-3">
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
                      "herotab-shadow bg-neutral-650 absolute left-0 right-0 mx-auto h-10 w-full rounded-lg",
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
