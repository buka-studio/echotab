"use client";

import LogoIcon from "~/../public/echotab/logo-icon.svg";

import { OpenSourceCard, PerformanceCard, PrivacyCard, WorkflowCard } from "./components/bento";
import FeaturesCarousel from "./components/FeaturesCarousel";
import InstallButton from "./components/InstallButton";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col">
            <style
                dangerouslySetInnerHTML={{
                    __html: `:root {--page-background: #000;}`,
                }}></style>
            <div className="flex-1 flex-col items-center justify-between p-8 md:p-12">
                <main className="relative z-10 my-auto flex flex-col items-center text-center">
                    <div
                        className="rounded-[1.875rem] shadow-sm shadow-neutral-950 outline-none transition-all duration-200 hover:scale-[102%] hover:shadow-md hover:shadow-neutral-950 focus-visible:scale-[102%] focus-visible:shadow-md focus-visible:shadow-neutral-950  
       focus-visible:outline-none active:scale-100 active:shadow-sm active:shadow-neutral-950">
                        <LogoIcon />
                    </div>
                    <h1 className="mt-5 font-mono text-4xl md:text-5xl">EchoTab</h1>
                    <p className="mt-1 text-balance text-xs tracking-[0.04375rem] text-[#A1A1A1] md:text-sm">
                        Clean & simple tab management <br />
                        browser extension.
                    </p>
                    <div className="mt-10 flex flex-col gap-2">
                        <InstallButton className="">Add to Chrome</InstallButton>
                        <div className="flex gap-5 text-neutral-500">
                            {/* <a>Add to Chrome</a>
              <a>Add to Firefox</a> */}
                        </div>
                    </div>

                    <div className="bento mx-auto mt-[100px] grid max-w-5xl grid-cols-5 gap-5">
                        <WorkflowCard className="col-span-5 md:col-span-3" />
                        <PrivacyCard className="col-span-5 md:col-span-2" />
                        <OpenSourceCard className="col-span-5 md:col-span-2" />
                        <PerformanceCard className="col-span-5 md:col-span-3" />
                    </div>

                    <div className="features mt-[100px]">
                        <FeaturesCarousel />
                    </div>
                </main>
            </div>

            <div className="flex w-full items-center justify-center px-5 py-8 lg:px-0">
                <footer className="flex w-full max-w-5xl flex-col justify-between gap-4 text-sm text-neutral-500 md:flex-row">
                    <div>
                        © 2024 <a href="https://buka.studio">Buka Studio</a>. All rights reserved
                    </div>
                    <div className="flex gap-5">
                        <a
                            href="https://github.com/buka-studio/echotab"
                            className="transition-colors duration-200 hover:text-white">
                            Github
                        </a>
                    </div>
                </footer>
            </div>
            {/* <MousePositionVarsSetter /> */}

            <svg xmlns="http://www.w3.org/2000/svg" className="absolute">
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="1.25"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                </filter>
            </svg>
        </div>
    );
}
