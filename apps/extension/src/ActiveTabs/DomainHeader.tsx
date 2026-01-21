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
import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { ReactNode, useMemo } from "react";

import { AnimatedNumberBadge } from "../components/AnimatedNumberBadge";
import { Favicon } from "../components/TabItem";
import {
  tabStoreActions,
  useTabStore,
  useViewTabIdsByDomain,
  useViewTabsById,
} from "../store/tabStore";
import { pluralize } from "../util";
import { getDomain } from "../util/url";

export default function DomainHeader({
  domain,
  actions,
  className,
}: {
  domain: string;
  actions?: ReactNode;
  className?: string;
}) {
  const tabs = useTabStore((s) => s.tabs);
  const viewTabIdsByDomain = useViewTabIdsByDomain();
  const viewTabsById = useViewTabsById();

  const domainTabIds = useMemo(() => {
    return tabs.filter((tab) => getDomain(tab.url) === domain).map((tab) => tab.id);
  }, [tabs, domain]);

  const viewTabIds = viewTabIdsByDomain[domain];
  const closeLabel = `This action will close ${pluralize(viewTabIds.length, "tab")}.`;
  const ctaLabel = viewTabIds.length < domainTabIds.length ? `Close` : "Close All";

  return (
    <div className={cn("flex justify-between", className)}>
      <div className="inline-flex items-center select-none">
        <span className="mr-2 inline-flex items-center gap-2">
          <Favicon src={viewTabsById[viewTabIds[0]].url} />
          <span className={cn("text-muted-foreground text-sm transition-colors duration-300")}>
            {domain}
          </span>
          <AnimatedNumberBadge value={viewTabIds?.length} />
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
              onClick={() => tabStoreActions.removeTabs(viewTabIds)}
              variant="destructive">
              {ctaLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
