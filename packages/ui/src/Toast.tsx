"use client";

import {
  CheckCircleIcon,
  InfoIcon,
  SpinnerIcon,
  WarningIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react";
import { Toaster as Sonner, toast, type ToasterProps } from "sonner";

const Toaster = ({ theme, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="text-success-foreground size-4.5" weight="fill" />,
        info: <InfoIcon className="text-info-foreground size-4.5" weight="fill" />,
        warning: <WarningIcon className="text-warning-foreground size-4.5" weight="fill" />,
        error: (
          <WarningOctagonIcon className="text-destructive-foreground size-4.5" weight="fill" />
        ),
        loading: <SpinnerIcon className="text-primary size-4.5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { toast, Toaster };
