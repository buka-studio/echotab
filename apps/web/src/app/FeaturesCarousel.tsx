import { useScroll, useSpring } from "framer-motion";

import "./FeaturesCarousel.css";

import { motion, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";

const features: { label: string; upcoming?: boolean }[] = [
  { label: "Open-source" },
  { label: "Keyboard-first" },
  { label: "Fast & performant" },
  { label: "Bulk tagging" },
  { label: "Instant search" },
  { label: "Shareable lists" },
  { label: "Local-only data" },
  { label: "Beautiful UI" },
  { label: "Export & import" },
  { label: "Statistics" },
];

function Upcoming() {
  return (
    <span className="bg-background text-foreground border-border flex items-center rounded-lg border px-2 py-1 font-mono text-base font-normal uppercase tracking-wide">
      Upcoming
    </span>
  );
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="item text-foreground relative flex items-center gap-3 whitespace-nowrap py-2 text-left font-serif text-3xl md:text-5xl">
      {children}
    </li>
  );
}

export default function FeaturesCarousel() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "start start"],
  });

  const offset = useTransform(scrollYProgress, [0, 1], [-25, 25]);
  const springOffset = useSpring(offset, {
    damping: 40,
    stiffness: 100,
  });

  const x = useTransform(springOffset, (v) => `${v}%`);
  const xReverse = useTransform(springOffset, (v) => `${-v}%`);

  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="font-mono uppercase">Features</h2>
      <div
        className="relative w-[min(1280px,100vw)] overflow-hidden mask-[linear-gradient(90deg,transparent_10%,black_25%,black_75%,transparent_90%)]"
        ref={ref}>
        <div className="track flex justify-center">
          <motion.ul className="items flex flex-nowrap gap-12" style={{ x }}>
            {features.map((feature) => (
              <Item key={feature.label}>
                {feature.label} {feature.upcoming && <Upcoming />}
              </Item>
            ))}
          </motion.ul>
        </div>
        <div className="track flex justify-center">
          <motion.ul className="items flex flex-nowrap gap-12" style={{ x: xReverse }}>
            {features.map((feature) => (
              <Item key={feature.label}>
                {feature.label} {feature.upcoming && <Upcoming />}
              </Item>
            ))}
          </motion.ul>
        </div>
      </div>
    </div>
  );
}
