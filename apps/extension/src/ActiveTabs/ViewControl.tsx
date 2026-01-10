import { Button } from "@echotab/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { cn } from "@echotab/ui/util";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, MixerVerticalIcon } from "@radix-ui/react-icons";

import { SortDir } from "../util/sort";
import { TabGrouping, TabSortProp, useActiveTabStore } from "./ActiveStore";

const domainViewSortOptions = [
  { value: TabSortProp.TabDomain, label: "Domain Name" },
  { value: TabSortProp.TabCount, label: "Tab Count" },
];

const windowViewSortOptions = [{ value: TabSortProp.Index, label: "Browser Order" }];

const viewOptions = [
  { value: TabGrouping.All, label: "Window" },
  { value: TabGrouping.Domain, label: "Domain" },
];

const sortOptionsByView = {
  [TabGrouping.All]: windowViewSortOptions,
  [TabGrouping.Domain]: domainViewSortOptions,
};

export default function ViewControl() {
  const tabStore = useActiveTabStore();

  function handleToggleSort(prop: TabSortProp) {
    tabStore.setView({
      sort: {
        prop,
        dir: tabStore.view.sort.dir === SortDir.Asc ? SortDir.Desc : SortDir.Asc,
      },
    });
  }

  function handleSetGrouping(grouping: TabGrouping) {
    tabStore.setView({
      grouping,
      sort: { prop: sortOptionsByView[grouping]![0]!.value, dir: SortDir.Asc },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MixerVerticalIcon className="mr-2 h-4 w-4" /> View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Group By</DropdownMenuLabel>

          {viewOptions.map(({ value, label }) => (
            <DropdownMenuItem
              keepOpen
              onClick={() => handleSetGrouping(value)}
              key={value}
              className="gap-2">
              {label}
              {tabStore.view.grouping === value && <CheckIcon className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          {sortOptionsByView[tabStore.view.grouping].map(({ value, label }) => {
            const active = tabStore.view.sort.prop === value;
            return (
              <DropdownMenuItem
                key={value}
                keepOpen
                onClick={() => handleToggleSort(value)}
                className="justify-between gap-2">
                {label}
                <div
                  className={cn({
                    "opacity-0": !active,
                  })}>
                  {tabStore.view.sort.dir === SortDir.Asc ? (
                    <ArrowUpIcon className="ml-auto h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="ml-auto h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
