"use client";

import { Command as CommandPrimitive, useCommandState } from "cmdk";
import * as React from "react";

import { cn } from "./util";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-t-lg focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <CommandPrimitive.Input
      className={cn(
        "placeholder:text-muted-foreground w-full bg-transparent p-2 text-base outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn(
        "scrollbar-gray max-h-[340px] overflow-x-hidden overflow-y-auto focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: React.ComponentProps<"div">) {
  const render = useCommandState((state) => state.filtered.count === 0);
  if (!render) return null;
  return (
    <div
      className={cn("py-6 text-center text-sm", className)}
      {...props}
      cmdk-empty=""
      role="presentation"
    />
  );
}

function CommandNotEmpty({ className, ...props }: React.ComponentProps<"div">) {
  const render = useCommandState((state) => state.filtered.count !== 0);
  if (!render) return null;
  return (
    <div
      className={cn("text-center text-sm", className)}
      {...props}
      cmdk-not-empty=""
      role="presentation"
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator className={cn("bg-border -mx-1 h-px", className)} {...props} />
  );
}

function CommandItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & { variant?: "default" | "primary" }) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&[data-selected=true]_.icon]:text-current [&[data-selected=true]_svg]:text-current",
        "aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        {
          "aria-selected:before:bg-primary aria-selected:before:absolute aria-selected:before:top-0 aria-selected:before:left-0 aria-selected:before:h-full aria-selected:before:w-[2px] aria-selected:before:rounded-sm aria-selected:before:content-['']":
            variant === "primary",
        },
        className,
      )}
      {...props}
    />
  );
}

function CommandCreateItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const search = useCommandState((state) => state.search);
  const isEmpty = useCommandState((state) => state.filtered.count === 0);

  if (search && isEmpty) {
    return <CommandItem {...props} value={search} />;
  }
  return null;
}

function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandCreateItem,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandNotEmpty,
  CommandSeparator,
  CommandShortcut,
};
