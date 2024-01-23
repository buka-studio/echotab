import { motion } from "framer-motion";

import { Favicon } from "./TabItem";
import { cn } from "./util";

export default function TabListPlaceholder({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("relative mx-auto flex w-full max-w-4xl flex-col gap-2", className)}>
            <div className="tabs-placeholder pointer-events-none flex flex-col gap-2 [&]:[mask-image:linear-gradient(to_top,transparent_0%,rgba(0,0,0,0.5))]">
                {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                        animate={{ opacity: 1 }}
                        transition={{
                            type: "tween",
                            delay: 0.02 * i,
                            duration: 0.5,
                        }}
                        initial={{ opacity: 0 }}
                        key={i}
                        className={cn(
                            "group/item bg-card border-border hover:bg-card-active [&:has(:focus-within)]:bg-card-active text-card-foreground hover:border-border-active [&:has(:focus-within)]:border-border-active flex min-h-12 w-full items-center gap-5 rounded-lg border p-2 transition-colors duration-200 @container",
                        )}>
                        <div className="flex flex-shrink-0">
                            <Favicon />
                        </div>
                        <span className="bg-foreground/20 h-3 w-full max-w-[30cqw] overflow-hidden text-ellipsis whitespace-nowrap rounded text-sm" />
                        <span className="group/link bg-foreground/5 flex h-3 w-full max-w-[25cqw] items-center gap-2 rounded transition-colors duration-200" />
                    </motion.div>
                ))}
            </div>
            {children}
        </div>
    );
}
