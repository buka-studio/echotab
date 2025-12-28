import { useRelativeMousePositionPropertiesRef } from "@echotab/ui/hooks";
import { cn } from "@echotab/ui/util";
import { ComponentProps, forwardRef, ReactNode } from "react";

const BentoCard = forwardRef<HTMLDivElement, ComponentProps<"div"> & { illustration?: ReactNode }>(
  function BentoCard({ className, illustration, children, ...props }, ref) {
    const relativeRef = useRelativeMousePositionPropertiesRef<HTMLDivElement>();

    return (
      <div className={cn("shadow-card relative rounded-[22px] p-px", className)}>
        <div
          className={cn(
            "relative-mouse bg-background border-border relative z-1 flex h-[414px] flex-col gap-10 overflow-hidden rounded-2xl border p-6",
          )}
          ref={ref}
          {...props}>
          <div className="illustration flex-1">{illustration}</div>
          <div className="description mt-auto">{children}</div>
        </div>
        <div
          ref={relativeRef}
          className={cn(
            "mouse-border bg-foreground absolute inset-0 rounded-[17px] opacity-30 transition-opacity duration-500 [&]:mask-[radial-gradient(40%_40%_at_var(--mouse-x,9999px)_var(--mouse-y,9999px),black_45%,transparent)]",
          )}
        />
      </div>
    );
  },
);

export default BentoCard;
