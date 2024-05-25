import { motion } from "framer-motion";

import { Favicon } from "./TabItem";
import { cn } from "./util";

export default function TabListPlaceholder({
    children,
    className,
    layout = "list",
    count = 10,
}: {
    children?: React.ReactNode;
    layout?: "list" | "grid";
    className?: string;
    count?: number;
}) {
    return (
        <div className={cn("relative mx-auto flex w-full max-w-4xl flex-col gap-2", className)}>
            <div
                className={cn(
                    "tabs-placeholder pointer-events-none flex flex-col gap-2 [&]:[mask-image:linear-gradient(to_top,transparent_0%,rgba(0,0,0,0.5))]",
                    {
                        "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]": layout === "grid",
                    },
                )}>
                {Array.from({ length: count }).map((_, i) => (
                    <motion.div
                        animate={{ opacity: 1 }}
                        transition={{
                            type: "tween",
                            delay: 0.05 * i,
                            duration: 0.5,
                        }}
                        initial={{ opacity: 0 }}
                        key={i}
                        className={cn(
                            "group/item flex min-h-12 w-full items-center gap-5 rounded-lg border border-dashed border-border-active bg-card p-2 text-card-foreground shadow transition-colors duration-200 @container dark:border-border-active/50",
                            {
                                "flex-col items-start": layout === "grid",
                            },
                        )}>
                        <div className="flex flex-shrink-0">
                            <Favicon />
                        </div>
                        <span className="h-3 w-full max-w-[30cqw] overflow-hidden text-ellipsis whitespace-nowrap rounded bg-foreground/10 text-sm" />
                        <span className="group/link flex h-3 w-full max-w-[25cqw] items-center gap-2 rounded bg-foreground/5 transition-colors duration-200" />
                    </motion.div>
                ))}
            </div>
            {children}
        </div>
    );
}
