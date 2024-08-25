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
import { ReactNode, useMemo } from "react";

import { pluralize } from "../util";
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

  const windowTabIds = useMemo(() => {
    return tabStore.tabs.filter((tab) => tab.windowId === window.id).map((tab) => tab.id);
  }, [tabStore.tabs, window.id]);

  const viewTabIds = tabStore.viewTabIdsByWindowId[window.id];
  const closeLabel =
    viewTabIds.length < windowTabIds.length
      ? `This action will close ${pluralize(viewTabIds.length, "tab")} in this window.`
      : "This action will close all tabs in this window.";
  const ctaLabel = viewTabIds.length < windowTabIds.length ? `Close` : "Close All";

  return (
    <div className="flex justify-between [&:not(:only-child)]:mb-4">
      <div className="select-none">
        <span className="mr-2 inline-flex items-center gap-2">
          <span className={cn("text-muted-foreground text-sm transition-colors duration-300")}>
            {window.label}
          </span>
          <Badge variant="card">{viewTabIds?.length}</Badge>
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
            <AlertDialogDescription>{closeLabel}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tabStore.removeTabs(viewTabIds)}
              variant="destructive">
              {ctaLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
