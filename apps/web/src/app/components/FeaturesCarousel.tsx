import { CSSProperties } from "react";

import "./FeaturesCarousel.css";

const features = [
  { label: "Tab tagging" },
  { label: "AI-powered tagging", upcoming: true },
  { label: "Tab search" },
  { label: "CmdK command menu" },
  { label: "List Sharing" },
  { label: "Import/Export" },
  { label: "Dark & light mode" },
  { label: "Statistics" },
  { label: "Multi-browser support", upcoming: true },
];

const Upcoming = () => (
  <span className="rounded-lg bg-[#252525] px-2 py-1 font-mono text-xs text-white md:text-sm">
    upcoming
  </span>
);

export default function FeaturesCarousel() {
  return (
    <div className="flex flex-col items-center gap-16 md:flex-row">
      <h2 className="bg-gradient-to-br from-[#EA620C] to-[#EA0C4F] bg-clip-text font-mono uppercase text-transparent">
        Features
      </h2>
      <div className="relative">
        <ul
          className="carousel"
          data-direction="vertical"
          style={{ "--count": features.length, "--speed": 10 } as CSSProperties}>
          {features.map((feature, index) => (
            <li
              key={index}
              className="carousel-item text-foreground flex w-full items-center gap-2 text-left text-xl md:text-3xl"
              style={{ "--index": index, "--inset": 1.5 } as CSSProperties}>
              {feature.label} {feature.upcoming && <Upcoming />}
            </li>
          ))}
        </ul>
        <div className="carousel-shadow pointer-events-none absolute inset-0" />
      </div>
    </div>
  );
}
