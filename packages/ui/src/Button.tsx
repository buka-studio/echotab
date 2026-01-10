import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "./util";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background dark:shadow hover:bg-foreground/90 border border-primary/20",
        destructive:
          "bg-destructive-background text-destructive-foreground border-destructive-separator dark:shadow-sm hover:bg-destructive-background/80 border focus-visible:ring-destructive-separator/60",
        warning:
          "bg-warning-background text-warning-foreground border-warning-separator dark:shadow-sm hover:bg-warning-background/80 border focus-visible:ring-warning-separator/60",
        info: "bg-info-background text-info-foreground border-info-separator dark:shadow-sm hover:bg-info-background/80 border focus-visible:ring-info-separator/60",
        outline:
          "border border-input bg-background dark:shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground dark:shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 rounded-md px-3 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button };
