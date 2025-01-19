import { cn } from "@echotab/ui/util";
import { AnimatePresence, motion } from "framer-motion";

export default function CardStack({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("relative h-[200px] w-[200px]", className)}>
      <AnimatePresence>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className="card bg-background border-border absolute left-1/2 top-0 h-full w-full rounded-lg border p-5 shadow-[0_0_6px_-1px_rgb(0_0_0_/0.1),0_0_4px_-2px_rgb(0_0_0_/0.1)] [transform:rotateX(60deg)_rotateY(0deg)_rotateZ(-45deg)_translateY(-50%)_translateX(-50%)]"
            initial={{ opacity: 0, top: 0 }}
            animate={{
              opacity: 1,
              top: `calc(50% + ${i * -10}px)`,
              transition: { type: "spring", stiffness: 50, damping: 10 },
            }}
            exit={{ opacity: 0, top: 0 }}>
            <div className="card-content bg-muted/20 h-full w-full rounded-lg"></div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
