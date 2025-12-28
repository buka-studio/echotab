"use client";

import { cva } from "class-variance-authority";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "./util";

const DrawerContext = React.createContext<{ direction?: "right" | "top" | "bottom" | "left" }>({
  direction: "right",
});

const Drawer = ({
  shouldScaleBackground = true,
  direction = "right",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerContext.Provider value={{ direction }}>
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      direction={direction}
      {...props}
    />
  </DrawerContext.Provider>
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const drawerContentVariants = cva(
  "bg-background/20 backdrop-blur-lg focus-visible:ring-ring fixed z-[51] flex border focus-visible:outline-none",
  {
    variants: {
      direction: {
        right: "ml-24 right-0 rounded-l-[10px] inset-y-0 h-screen w-[400px]",
        top: "mb-24 top-0 rounded-b-[10px] inset-x-0 h-[90dvh]",
        bottom: "flex-col mt-24 rounded-t-[10px] bottom-0 inset-x-0 h-[90dvh] h-auto",
        left: "mr-24 left-0 rounded-r-[10px] inset-y-0 h-screen w-[400px]",
      },
    },
    defaultVariants: {
      direction: "right",
    },
  },
);

const drawerHandleVariants = cva("bg-muted-foreground mx-auto flex-shrink-0 rounded-full", {
  variants: {
    direction: {
      right: "ml-4 h-[100px] w-1 my-auto",
      top: "mb-4 h-1 w-[100px] mx-auto",
      bottom: "mt-4 h-1 w-[100px] mx-auto",
      left: "mr-4 h-[100px] w-1 my-auto",
    },
  },
});

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & { handle?: boolean }
>(({ className, children, handle = true, ...props }, ref) => {
  const { direction } = React.useContext(DrawerContext);

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={drawerContentVariants({ direction, className })}
        {...props}>
        {handle && <div className={drawerHandleVariants({ direction })} />}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
