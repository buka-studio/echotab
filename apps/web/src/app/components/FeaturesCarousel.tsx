import { CSSProperties } from "react";
import "./FeaturesCarousel.css";

const features = [
  { label: "Tab tagging" },
  { label: "AI-powered tagging", upcoming: true },
  { label: "Tab search" },
  { label: "CmdK command menu" },
  { label: "Import/Export" },
  { label: "Dark & light mode" },
  { label: "Statistics" },
  { label: "Multi-browser support", upcoming: true },
];

const Upcoming = () => (
  <span className="px-2 py-1 bg-[#252525] rounded-lg text-white font-mono text-xs md:text-sm">
    upcoming
  </span>
);

export default function FeaturesCarousel() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-16">
      <h2 className="from-[#EA620C] to-[#EA0C4F] bg-gradient-to-br bg-clip-text text-transparent font-mono uppercase">
        Features
      </h2>
      <div className="relative">
        <ul
          className="carousel"
          data-direction="vertical"
          style={{ "--count": features.length, "--speed": 10 } as CSSProperties}
        >
          {features.map((feature, index) => (
            <li
              key={index}
              className="carousel-item text-left text-[#e3e3e3] text-xl md:text-3xl flex w-full items-center gap-2"
              style={{ "--index": index, "--inset": 1.5 } as CSSProperties}
            >
              {feature.label} {feature.upcoming && <Upcoming />}
            </li>
          ))}
        </ul>
        <div className="shadow absolute inset-0 pointer-events-none " />
      </div>
    </div>
  );
}
