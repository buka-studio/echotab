import { AnimationPlaybackControls, stagger, useAnimate } from "framer-motion";
import { ComponentProps, useRef } from "react";

import PointerIcon from "~/../public/echotab/pointer.svg";
import SelectIcon from "~/../public/echotab/select.svg";

import { mockTabs } from "../../constants";
import BentoCard from "./BentoCard";
import TabItem from "./TabItem";

export default function WorkflowCard({ className, ...props }: ComponentProps<"div">) {
    const [scope, animate] = useAnimate();
    const animation = useRef<AnimationPlaybackControls | null>(null);
    const hovering = useRef(false);

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
                [
                    ".select",
                    { width: "150px", height: "150px" },
                    { duration: 0.75, type: "spring" },
                ],

                [".select-overlay", { opacity: 1 }, { at: "<" }],
                [
                    ".tab",
                    { background: "#232120", border: "1px solid #46403F" },
                    { delay: stagger(0.15), at: "-0.5" },
                ],
                [".tag", { opacity: 1 }, { delay: stagger(0.1), at: "+0.3" }],
                [".select", { opacity: 0 }],
                [
                    ".tab",
                    { y: "-100%", opacity: 0 },
                    { delay: stagger(0.07), at: "<", duration: 0.3 },
                ],
            ]);
            animation.current = mainAnimation;

            mainAnimation.then(() =>
                animate([
                    [".tab", { opacity: 0, y: "100%" }, { duration: 0 }],
                    [
                        ".tab",
                        {
                            y: 0,
                            background: "#1A1A1A",
                            border: "1px solid #2A2726",
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
            className={className}
            illustration={
                <div className="relative h-full overflow-hidden">
                    <div className="tabs relative right-[-100px] top-[30px] flex flex-col gap-2">
                        {mockTabs.slice(0, 3).map((tab) => (
                            <TabItem key={tab.link} tab={tab} />
                        ))}
                    </div>
                    <div className="overlay absolute right-0 top-0 h-full w-12 bg-[linear-gradient(90deg,transparent,#101010)]" />
                    <div className="select absolute left-5 top-5">
                        <div className="select-overlay h-full w-full border border-[#FF7A2B] bg-[#ea5a0c1a] opacity-0" />
                        <PointerIcon className="absolute bottom-[-20px] right-[-20px]" />
                    </div>
                </div>
            }
            ref={scope}>
            <div>
                <h3 className="mb-2 flex items-center gap-2 font-mono text-sm uppercase">
                    <SelectIcon /> Efficient Workflow
                </h3>
                <p className="text-balance text-left text-neutral-400">
                    Organize and manage your tabs with multi-select and tagging capabilities.
                </p>
            </div>
        </BentoCard>
    );
}
