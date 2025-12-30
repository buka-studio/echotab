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
  ...props
}: Props & ComponentProps<"button">) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn({ "text-foreground": active }, className)}
      {...props}>
      {!active || dir === SortDir.Asc ? (
        <ArrowUpIcon className="h-4 w-4" />
      ) : (
        <ArrowDownIcon className="h-4 w-4" />
      )}
    </Button>
  );
}
