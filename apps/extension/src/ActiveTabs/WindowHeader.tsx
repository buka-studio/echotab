import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@echotab/ui/AlertDialog";
import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { ReactNode } from "react";

import { useActiveTabStore } from "./ActiveStore";

export default function WindowHeader({
  window,
  actions,
}: {
  window: {
    id: number;
    label: string;
  };
  actions?: ReactNode;
}) {
  const tabStore = useActiveTabStore();

  const tabIds = tabStore.viewTabIdsByWindowId[window.id];

  return (
    <div className="flex justify-between [&:not(:only-child)]:mb-4">
      <div className="select-none">
        <span className="mr-2 inline-flex items-center gap-2">
          <span className={cn("text-muted-foreground text-sm transition-colors duration-300")}>
            {window.label}
          </span>
          <Badge variant="card">{tabIds?.length}</Badge>
        </span>
        {actions}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost">Close All</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close all tabs in this window.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tabStore.removeAllInWindow(window.id)}
              variant="destructive">
              Close All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
