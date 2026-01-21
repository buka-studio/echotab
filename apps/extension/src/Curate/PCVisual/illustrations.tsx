import { animate, stagger } from "framer-motion";
import { ComponentProps, useEffect, useRef } from "react";

import { wait } from "~/util";

function pickDispersed<T>(arr: T[], pct: number): T[] {
  const count = Math.ceil((pct / 100) * arr.length);
  if (count <= 0) return [];
  if (count >= arr.length) return [...arr];

  const result: T[] = [];
  const bucketSize = arr.length / count;

  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);
    const randomIndex = Math.floor(Math.random() * (end - start)) + start;
    if (randomIndex < arr.length) {
      result.push(arr[randomIndex] as T);
    }
  }
  return result;
}

export function SmileyIllustration({
  className,
  ...props
}: { className?: string } & ComponentProps<"svg">) {
  return (
    <>
      <path
        d="M167.211 98.9644L170.471 98.9075L170.983 104.761L188.155 104.461L187.643 98.6078L190.871 98.5514L191.411 104.726L188.506 104.777L188.762 107.704L170.944 108.015L170.688 105.088L167.751 105.139L167.211 98.9644Z"
        fill="var(--visual)"
        className="animate-blink"
      />
      <path
        d="M171.255 92.7199L174.515 92.663L174.799 95.9112L171.539 95.9681L171.255 92.7199ZM177 92.6196L180.228 92.5632L180.512 95.8115L177.285 95.8678L177 92.6196Z"
        fill="var(--visual)"
        className="animate-blink"
      />
    </>
  );
}

export function ChristmasTreeIllustration({
  className,
  ...props
}: { className?: string } & ComponentProps<"svg">) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const scope = "[data-slot='tree-lights'] rect";
    const lights = Array.from(ref.current?.querySelectorAll(scope) || []) as SVGRectElement[];

    if (!lights.length) return;

    const runAnimation = async () => {
      await animate(scope, { fill: "oklch(0 0 0 0)" }, { duration: 0.1 });

      await animate(scope, { fill: "var(--tree-light)" }, { delay: stagger(0.075), duration: 0.1 });

      await wait(500);

      await animate(scope, { opacity: [1, 0, 1, 0, 1] }, { duration: 0.5, times: [0, 0.5, 1] });

      function blinkLights() {
        const selection = pickDispersed(lights, 50);

        lights.forEach((l) => l.setAttribute("fill", "oklch(0 0 0 0)"));
        selection.forEach((l) => l.setAttribute("fill", "var(--tree-light)"));
      }

      await wait(250);

      blinkLights();

      const interval = setInterval(() => {
        blinkLights();
      }, 1000);

      return () => clearInterval(interval);
    };

    runAnimation();
  }, []);

  return (
    <svg
      width="68"
      height="52"
      viewBox="0 0 68 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      className={className}
      {...props}>
      <rect x="20" y="16" width="4" height="4" fill="var(--tree)" />
      <rect x="20" y="20" width="4" height="4" fill="var(--tree)" />
      <rect x="16" y="24" width="4" height="4" fill="var(--tree)" />
      <rect x="16" y="28" width="4" height="4" fill="var(--tree)" />
      <rect x="24" y="12" width="4" height="4" fill="var(--tree)" />
      <path d="M12 32H16V36H12V32Z" fill="var(--tree)" />
      <rect x="16" y="36" width="4" height="4" fill="var(--tree)" />
      <path d="M20 36H24V40H20V36Z" fill="var(--tree)" />
      <rect x="24" y="40" width="4" height="4" fill="var(--tree)" />
      <rect x="28" y="40" width="4" height="4" fill="var(--tree)" />
      <rect x="28" y="48" width="4" height="4" fill="var(--tree)" />
      <rect x="32" y="48" width="4" height="4" fill="var(--tree)" />
      <rect x="32" y="44" width="4" height="4" fill="var(--tree)" />
      <rect x="32" y="40" width="4" height="4" fill="var(--tree)" />
      <path d="M48 16H44V20H48V16Z" fill="var(--tree)" />
      <path d="M48 20H44V24H48V20Z" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 52 24)" fill="var(--tree)" />
      <path d="M52 28H48V32H52V28Z" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 56 32)" fill="var(--tree)" />
      <path d="M52 36H48V40H52V36Z" fill="var(--tree)" />
      <path d="M48 36H44V40H48V36Z" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 44 40)" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 40 40)" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 40 48)" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 44 12)" fill="var(--tree)" />
      <rect x="28" y="8" width="4" height="4" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 40 8)" fill="var(--tree)" />
      <path d="M28 4H32V8H28V4Z" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 40 4)" fill="var(--tree)" />
      <rect x="32" width="4" height="4" fill="var(--tree)" />
      <rect width="4" height="4" transform="matrix(-1 0 0 1 36 0)" fill="var(--tree)" />

      <g data-slot="tree-lights">
        <rect x="32" y="0" width="4" height="4" />

        <rect x="28" y="8" width="4" height="4" />
        <rect x="32" y="12" width="4" height="4" />
        <rect x="36" y="16" width="4" height="4" />
        <rect x="40" y="20" width="4" height="4" />
        <rect x="44" y="16" width="4" height="4" />

        <rect x="24" y="16" width="4" height="4" />

        <rect x="28" y="20" width="4" height="4" />
        <rect x="32" y="24" width="4" height="4" />
        <rect x="36" y="28" width="4" height="4" />
        <rect x="40" y="28" width="4" height="4" />
        <rect x="44" y="28" width="4" height="4" />
        <rect x="48" y="24" width="4" height="4" />

        <rect x="16" y="24" width="4" height="4" />
        <rect x="20" y="24" width="4" height="4" />
        <rect x="24" y="28" width="4" height="4" />
        <rect x="28" y="32" width="4" height="4" />
        <rect x="32" y="36" width="4" height="4" />
        <rect x="36" y="40" width="4" height="4" />
        <rect x="40" y="40" width="4" height="4" />
        <rect x="44" y="36" width="4" height="4" />
        <rect x="48" y="36" width="4" height="4" />
        <rect x="52" y="32" width="4" height="4" />

        <rect x="16" y="32" width="4" height="4" />
        <rect x="20" y="36" width="4" height="4" />
        <rect x="24" y="40" width="4" height="4" />
      </g>
    </svg>
  );
}
