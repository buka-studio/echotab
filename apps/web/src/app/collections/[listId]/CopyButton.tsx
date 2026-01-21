"use client";

import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { useCopyToClipboard } from "@echotab/ui/hooks";
import { cn } from "@echotab/ui/util";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentProps } from "react";

const MotionCopyIcon = motion(CopyIcon);
const MotionCheckIcon = motion(CheckIcon);

const iconProps = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
  transition: { duration: 0.1 },
};

export function CopyButtonWithTooltip({
  value,
  className,
  tooltipText,
  children,
  ...props
}: { value: string; tooltipText?: string } & Omit<
  ComponentProps<typeof ButtonWithTooltip>,
  "tooltipText"
>) {
  const [copied, copy] = useCopyToClipboard();

  return (
    <ButtonWithTooltip
      tooltipText={tooltipText || "Copy to clipboard"}
      onClick={() => copy(value)}
      className={cn("gap-2", className)}
      side="top"
      {...props}>
      <AnimatePresence initial={false} mode="wait">
        {copied ? (
          <MotionCheckIcon className="size-4" key="copied" {...iconProps} />
        ) : (
          <MotionCopyIcon className="size-4" key="copy" {...iconProps} />
        )}
      </AnimatePresence>
      {children}
    </ButtonWithTooltip>
  );
}

export default function CopyButton({
  value,
  className,
  children,
  ...props
}: { value: string } & ComponentProps<typeof Button>) {
  const [copied, copy] = useCopyToClipboard();

  return (
    <Button onClick={() => copy(value)} className={cn("gap-2", className)} {...props}>
      <AnimatePresence initial={false} mode="wait">
        {copied ? (
          <MotionCheckIcon className="size-4" key="copied" {...iconProps} />
        ) : (
          <MotionCopyIcon className="size-4" key="copy" {...iconProps} />
        )}
      </AnimatePresence>
      {children}
    </Button>
  );
}
