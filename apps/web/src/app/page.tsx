"use client";

import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";

import { PerformanceCard, WorkflowCard } from "./components/bento";
import { extensionStoreURL } from "./constants";
import CTA from "./CTA";
import FeaturesCarousel from "./FeaturesCarousel";
import Hero from "./Hero";

function Heading({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex w-full flex-col items-center gap-5", className)}>
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex items-center gap-4 font-mono uppercase">
          <div className="bg-foreground h-4 w-4 rounded-full" />
          <div>
            EchoTab <span className="align-super text-xs">tm</span>
          </div>
        </div>
        <h1 className="max-w-[700px] text-pretty text-center font-serif text-4xl md:text-5xl">
          Clean & simple tab management browser extension
        </h1>
        <Button variant="outline" size="lg" className="px-6 font-mono text-base uppercase" asChild>
          <a href={extensionStoreURL} target="_blank" rel="noopener noreferrer">
            Add to your browser
          </a>
        </Button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="text-muted-foreground flex w-full max-w-5xl flex-col justify-between gap-4 text-sm md:flex-row">
      <div>
        © {new Date().getFullYear()} <a href="https://buka.studio">Buka Studio</a>. All rights
        reserved
      </div>
      <div className="flex gap-5">
        <a
          href="https://github.com/buka-studio/echotab"
          className="hover:text-foreground transition-colors duration-200">
          Github
        </a>
      </div>
    </footer>
  );
}

// src https://github.com/yoksel/url-encoder
// const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
// function encodeSVG(svg: string) {
//   // Use single quotes instead of double to avoid encoding.

//   svg = svg.replace(/>\s{1,}</g, `><`);
//   svg = svg.replace(/\s{2,}/g, ` `);

//   // Using encodeURIComponent() as replacement function
//   // allows to keep result code readable
//   return svg.replace(symbols, encodeURIComponent);
// }

// function PlaceholderItem({ className = "" }) {
//   useTheme();

//   const isDarkTheme = document.documentElement.classList.contains("dark");

//   const linesPatternBg =
//     "data:image/svg+xml," +
//     encodeSVG(`<svg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'>
//             <g fill='hsl(${window.getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground")})' fill-opacity=${isDarkTheme ? "'0.15'" : "'0.25'"} fill-rule='evenodd'>
//                 <path d='M5 0h1L0 6V5zM6 5v1H5z' />
//             </g>
//         </svg>`);

//   return (
//     <div
//       style={{ backgroundImage: `url("${linesPatternBg}")` }}
//       className={cn(
//         "bg-surface-1 flex items-center justify-center border border-dashed",
//         className,
//       )}
//     />
//   );
// }

export default function Home() {
  return (
    <div className="flex min-h-screen max-w-[100vw] flex-col overflow-hidden">
      <div className="flex-1 flex-col items-center justify-between">
        <div className="lines-container">
          <div className="lines" />
        </div>

        <main className="relative z-10 my-auto flex flex-col items-center gap-[150px] text-center md:gap-[200px]">
          <Heading className="pt-[150px]" />
          <Hero />
          <FeaturesCarousel />
          <div className="bento relative z-[2] flex max-w-screen-lg flex-col gap-5 p-5 md:flex-row">
            <WorkflowCard className="flex-1" />
            <PerformanceCard className="flex-1" />
          </div>
          <CTA />
        </main>
      </div>
      <div className="mt-[200px] flex w-full items-center justify-center px-5 py-8 lg:px-0">
        <Footer />
      </div>
    </div>
  );
}
