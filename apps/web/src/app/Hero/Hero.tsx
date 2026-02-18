import GlowOutline from "@echotab/ui/GlowOutline";
import { useMatchMedia } from "@echotab/ui/hooks";
import {
  animate,
  motion,
  motionValue,
  MotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import TabItem from "../components/TabItem";
import { mockTabs } from "../constants";
import CommandMenu from "./CommandMenu";
import type { GenieTarget } from "./GenieTabs";
import { GenieTabs, imageToTexture } from "./GenieTabs";
import TabSwitch from "./TabSwitch";

const SVG_WIDTH = 473;
const SVG_HEIGHT = 291;
const SVG_ASPECT = SVG_WIDTH / SVG_HEIGHT;

const TARGET_COUNT_LG = 25;
const TARGET_COUNT_SM = 15;
const TARGET_WIDTH_PX_LG = 300;
const TARGET_WIDTH_PX_SM = 150;

const VISIBLE_AT_START_PX_LG = 320;
const VISIBLE_AT_START_PX_SM = 200;
const FINAL_TOP_OFFSET_PX = 150;

const HERO_ENTRANCE_Y = 150;

interface TargetData {
  target: GenieTarget;
  finishAt: number;
  opacityMV: MotionValue<number>;
}

export default function Hero() {
  const [glowKey, setGlowKey] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroReady, setHeroReady] = useState(false);
  const [backdropSize, setBackdropSize] = useState<{ width: number; height: number } | null>(null);
  const [targetData, setTargetData] = useState<TargetData[]>([]);

  const isMobile = useMatchMedia("(max-width: 768px)");
  const VISIBLE_AT_START_PX = isMobile ? VISIBLE_AT_START_PX_SM : VISIBLE_AT_START_PX_LG;
  const TARGET_WIDTH_PX = isMobile ? TARGET_WIDTH_PX_SM : TARGET_WIDTH_PX_LG;
  const TARGET_COUNT = isMobile ? TARGET_COUNT_SM : TARGET_COUNT_LG;

  const heroLayoutRef = useRef({ initialOffset: 0, scrollRange: 1, heroPageTop: 0 });

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const heroPageTop = hero.getBoundingClientRect().top + window.scrollY - HERO_ENTRANCE_Y; // comp. for framer init y
    const vh = window.innerHeight;
    heroLayoutRef.current = {
      initialOffset: Math.max(0, vh - VISIBLE_AT_START_PX - heroPageTop),
      scrollRange: Math.max(0, heroPageTop - FINAL_TOP_OFFSET_PX),
      heroPageTop,
    };
    setHeroReady(true);
  }, [VISIBLE_AT_START_PX]);

  const { scrollY } = useScroll();
  const scrollProgress = useTransform(scrollY, (s) => {
    const { scrollRange } = heroLayoutRef.current;
    return Math.min(1, Math.max(0, s / scrollRange));
  });

  const progress = useSpring(scrollProgress, {
    mass: 0.1,
    stiffness: 100,
    damping: 20,
    restDelta: 0.001,
  });

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const img = new Image();
    img.src = isDark ? "/Window-dark.svg" : "/Window.svg";
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(500, window.innerWidth);
      const { heroPageTop } = heroLayoutRef.current;
      const h = Math.max(500, window.innerHeight, heroPageTop + VISIBLE_AT_START_PX);

      setBackdropSize({ width: w, height: h });

      const widthNorm = TARGET_WIDTH_PX / w;
      const heightPx = TARGET_WIDTH_PX / SVG_ASPECT;
      const heightNorm = heightPx / h;

      const canvas = new OffscreenCanvas(TARGET_WIDTH_PX * dpr, heightPx * dpr);

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const texture = imageToTexture(canvas);

      const data = Array.from({ length: TARGET_COUNT }, (_, i) => {
        const opacityMV = motionValue(0);
        return {
          target: {
            id: `window-${i}`,
            texture,
            position: {
              x: Math.random() * (1 - widthNorm),
              y: Math.random() * (1 - heightNorm),
            },
            dimensions: { width: widthNorm, height: heightNorm },
            progress: 0,
            easing: 1 + Math.floor(Math.random() * 2),
          },
          finishAt: 0.2 + (i / (TARGET_COUNT - 1)) * 0.65 + (Math.random() - 0.5) * 0.04,
          opacityMV,
        };
      });
      setTargetData(data);

      data.forEach(({ opacityMV }, i) => {
        animate(opacityMV, 1, {
          type: "tween",
          ease: "easeIn",
          duration: 0.35,
          delay: i * 0.05,
        });
      });
    };
  }, [TARGET_WIDTH_PX, TARGET_COUNT, VISIBLE_AT_START_PX]);

  const activeTargets = useMemo(
    () =>
      targetData.map(({ target, finishAt, opacityMV }) => ({
        ...target,
        get progress() {
          return Math.min(1, Math.max(0, progress.get() / finishAt));
        },
        get opacity() {
          return Math.min(1, Math.max(0, opacityMV.get()));
        },
      })),
    [targetData, progress],
  );

  const [visibleTabCount, setVisibleTabCount] = useState(0);

  useMotionValueEvent(progress, "change", (p) => {
    const completed = targetData.filter(({ finishAt }) => p / finishAt >= 1).length;
    const ratio = TARGET_COUNT > 0 ? completed / TARGET_COUNT : 0;
    const count = Math.min(mockTabs.length, Math.round(ratio * mockTabs.length));
    setVisibleTabCount(count);
  });

  const allTabsVisible = visibleTabCount >= mockTabs.length;

  const windowTranslateY = useTransform(
    progress,
    (p) => (1 - p) * heroLayoutRef.current.initialOffset,
  );
  const maskOpaqueEnd = useTransform(progress, (p) => 40 + p * 60);
  const maskFadeEnd = useTransform(maskOpaqueEnd, (v) => Math.min(100, v + 30));
  const maskImage = useTransform(
    [maskOpaqueEnd, maskFadeEnd],
    ([opaque, fade]) => `linear-gradient(to bottom, black ${opaque}%, transparent ${fade}%)`,
  );

  return (
    <>
      {backdropSize && (
        <div
          className="pointer-events-none absolute"
          style={{
            width: backdropSize.width,
            height: backdropSize.height,
            left: "50%",
            marginLeft: -backdropSize.width / 2,
          }}>
          <GenieTabs targets={activeTargets} onUpdate={progress} />
        </div>
      )}

      <motion.div
        ref={heroRef}
        className="hero relative"
        initial={{ opacity: 0, y: HERO_ENTRANCE_Y, filter: "blur(10px)", scale: 1.1 }}
        animate={heroReady ? { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 } : undefined}
        transition={{ type: "tween", duration: 1, ease: [0.65, 0.05, 0.36, 1] }}>
        <motion.div
          className="window border-border-active bg-background-base relative w-[min(1024px,90vw)] origin-[center_bottom] overflow-clip rounded-xl border shadow-[0_4px_4px_1px_rgba(0,0,0,.10),0_0_0_8px_var(--secondary)]"
          style={{
            y: windowTranslateY,
            maskImage,
            WebkitMaskImage: maskImage,
          }}>
          <div className="bg-background w-full rounded-t-[11px] p-5 py-3">
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-border-active h-3 w-3 rounded-full" />
              ))}
            </div>
          </div>
          <div className="border-border mx-auto max-w-2xl border-r border-l px-3 pt-10">
            <div className="mb-10 flex justify-between">
              <TabSwitch />
            </div>
            <div className="command-menu outlined-bottom mb-5 pb-5">
              <div className="relative">
                <CommandMenu onClick={() => setGlowKey((k) => k + 1)} />
                {allTabsVisible && <GlowOutline className="rounded-xl" width={2} key={glowKey} />}
              </div>
            </div>
            <div className="herotabs border-border relative mx-auto flex max-w-[650px] flex-col rounded-xl pb-3 md:pb-8">
              <div className="mb-3 flex items-center px-3 text-left text-sm">
                Bookmarks{" "}
                <AnimatedNumberBadge
                  value={visibleTabCount}
                  className="ml-2 min-w-[30px] justify-center text-center"
                />
              </div>
              <div className="relative">
                {mockTabs.map((tab, i) => {
                  const isVisible = i < visibleTabCount;
                  return (
                    <div
                      key={i}
                      className="[&:first-child_.herotab]:rounded-t-lg [&:last-child_.herotab]:rounded-b-lg">
                      <TabItem
                        tab={tab}
                        className="herotab rounded-none"
                        style={{
                          transition:
                            "opacity 500ms ease-out, transform 500ms ease-out, filter 500ms ease-out",
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible
                            ? "scale(1) translateY(0)"
                            : "scale(1.05) translateY(-12px)",
                          filter: isVisible ? "blur(0px)" : "blur(4px)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
