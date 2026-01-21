import { AnimationPlaybackControls, stagger, useAnimate } from "framer-motion";
import { useTheme } from "next-themes";
import { ComponentProps, CSSProperties, useRef } from "react";

import PointerIcon from "~/../public/echotab/pointer.svg";

import { mockTabs } from "../../constants";
import TabItem from "../TabItem";
import BentoCard from "./BentoCard";

export default function WorkflowCard({ className, ...props }: ComponentProps<"div">) {
  const [scope, animate] = useAnimate();
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const hovering = useRef(false);
  const { resolvedTheme } = useTheme();

  const onMouseEnter = async () => {
    if (hovering.current || animation.current) {
      return;
    }
    hovering.current = true;

    async function animateWorkflow() {
      if (!hovering.current) {
        return;
      }

      const mainAnimation = animate([
        [".select", { width: "20px", height: "20px" }, { duration: 0.25 }],
        [".select", { width: "150px", height: "150px" }, { duration: 0.75, type: "spring" }],

        [".select-overlay", { opacity: 1 }, { at: "<" }],
        [
          ".tab",
          { backgroundColor: "var(--card-active-bg)", border: "1px solid var(--border)" },
          { delay: stagger(0.125), at: "-0.5" },
        ],
        [".tag", { opacity: 1 }, { delay: stagger(0.1), at: "+0.3" }],
        [".select", { opacity: 0 }],
        [".tab", { y: "-100%", opacity: 0 }, { delay: stagger(0.05), at: "<", duration: 0.25 }],
      ]);
      animation.current = mainAnimation;

      mainAnimation.then(() =>
        animate([
          [".tab", { backgroundColor: "var(--card-bg)", opacity: 0, y: "100%" }, { duration: 0 }],
          [
            ".tab",
            {
              y: 0,
              border: "1px solid var(--border)",
              opacity: 1,
            },
            {
              delay: stagger(0.1),
            },
          ],
          [".tag", { opacity: 0 }, { duration: 0 }],
          [".select", { height: "0px", width: "0px" }, { duration: 0 }],
          [".select", { opacity: 1 }],
        ]).then(() => {
          animation.current = null;

          setTimeout(() => animateWorkflow(), 1000);
        }),
      );
    }

    animateWorkflow();
  };

  const onMouseLeave = () => {
    hovering.current = false;
  };

  return (
    <BentoCard
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={
        {
          "--card-bg": "var(--card)",
          "--card-active-bg": "var(--card-active)",
        } as CSSProperties
      }
      className={className}
      illustration={
        <div className="relative h-full overflow-hidden">
          <div className="tabs relative top-[30px] right-[-100px] flex flex-col gap-2">
            {mockTabs.slice(0, 3).map((tab) => (
              <TabItem key={tab.link} tab={tab} className="transition-colors duration-200" />
            ))}
          </div>
          <div className="overlay to-background absolute top-0 right-0 h-full w-12 bg-linear-to-r from-transparent" />
          <div className="select absolute top-5 left-5">
            <div className="select-overlay h-full w-full border border-[#FF7A2B] bg-[#ea5a0c1a] opacity-0" />
            <PointerIcon className="absolute right-[-20px] bottom-[-20px]" />
          </div>
        </div>
      }
      ref={scope}>
      <div>
        <h3 className="text-foreground mb-2 flex items-center gap-2 font-mono text-sm uppercase">
          Efficient Workflow
        </h3>
        <p className="text-muted-foreground text-left text-balance">
          Organize and manage your tabs with multi-select and tagging capabilities.
        </p>
      </div>
    </BentoCard>
  );
}
