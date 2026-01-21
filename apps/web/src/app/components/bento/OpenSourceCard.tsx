import { useRelativeMousePositionPropertiesRef } from "@echotab/ui/hooks";
import { cn } from "@echotab/ui/util";
import { ComponentProps } from "react";

import Active from "~/../public/echotab/bento/os-active.svg";
import Base from "~/../public/echotab/bento/os-base.svg";
import BoxIcon from "~/../public/echotab/box.svg";

import BentoCard from "./BentoCard";

export default function OpenSourceCard({ className, ...props }: ComponentProps<"div">) {
  const relativeRef = useRelativeMousePositionPropertiesRef<HTMLDivElement>();

  return (
    <BentoCard
      className={cn(className, "group")}
      illustration={
        <div
          ref={relativeRef}
          className="illustration logo-illustration relative -top-8 [&_.logo]:[transform-origin:center] [&_.logo]:transition-transform [&_.logo]:duration-300 group-hover:[&_.logo]:scale-[1.03]">
          <Base className="absolute inset-0 left-[50%] translate-x-[-50%]" />
          <Active className="active absolute inset-0 left-[50%] translate-x-[-50%] transition-opacity duration-500 [&]:[mask-image:radial-gradient(40%_40%_at_var(--mouse-x,9999px)_var(--mouse-y,9999px),black_45%,transparent)]" />
        </div>
      }>
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-mono text-sm uppercase">
          <BoxIcon /> Open Source
        </h3>
        <p className="text-muted-foreground text-left text-balance">
          Contribute to the development of Echotab.
        </p>
      </div>
    </BentoCard>
  );
}
