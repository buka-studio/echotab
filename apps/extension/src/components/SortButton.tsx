import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { ComponentProps } from "react";

import { SortDir } from "../util/sort";

interface Props {
  active: boolean;
  dir?: SortDir;
}

export default function SortButton({
  active,
  dir,
  className,
  children,
  ...props
}: Props & ComponentProps<"button">) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn({ "text-foreground": active }, className)}
      {...props}>
      {children}
      {!active || dir === SortDir.Asc ? (
        <ArrowUpIcon className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDownIcon className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
