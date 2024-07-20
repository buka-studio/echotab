import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import { DialogTrigger } from "@echotab/ui/Dialog";
import { cn } from "@echotab/ui/util";
import { CaretSortIcon, FilePlusIcon, FileTextIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../../components/ItemListPlaceholder";
import { useBookmarkStore } from "../BookmarkStore";
import ItemGrid from "../ItemGrid";
import { getLists } from "./api";
import ListFormDialog from "./ListFormDialog";
import TabListItem from "./TabListItem";

export default function SavedTabs() {
  const bookmarkStore = useBookmarkStore();

  const [expanded, setExpanded] = useState(true);

  const publicLists = useQuery({
    queryKey: ["lists"],
    queryFn: getLists,
    retry: 0,
    enabled: bookmarkStore.lists.length > 0,
    refetchOnWindowFocus: false,
  });

  const publicListsById = useMemo(() => {
    return Object.fromEntries(publicLists.data?.map((list) => [list.localId, list]) ?? []);
  }, [publicLists.data]);

  return (
    <div>
      <div className="mb-2 flex select-none items-center text-sm">
        <span className="mr-2 inline-flex gap-2 px-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <FileTextIcon /> Tab Lists
          </span>
          <Badge variant="card">{bookmarkStore.lists?.length}</Badge>
        </span>
        <Button
          variant="ghost"
          onClick={() => {
            setExpanded(!expanded);
          }}>
          {expanded ? "Collapse" : "Expand"}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
        <ListFormDialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className={cn("flex", "ml-auto")}>
              <FilePlusIcon className="mr-2 h-4 w-4" /> New List
            </Button>
          </DialogTrigger>
        </ListFormDialog>
      </div>

      {expanded && (
        <>
          {bookmarkStore.lists.length === 0 && (
            <ItemListPlaceholder
              layout="grid"
              count={5}
              className="[&_.items-placeholder]:max-h-[110px]">
              <ItemListPlaceholderCopy
                title="No tab lists yet."
                subtitle='Create a new list by clicking "New List" or by selecting saved links.'
              />
            </ItemListPlaceholder>
          )}
          <ItemGrid items={bookmarkStore.lists.map((l) => l.id)}>
            {({ index }) => {
              const list = bookmarkStore.lists[index];

              return <TabListItem list={list} publicList={publicListsById[list.id]} />;
            }}
          </ItemGrid>
        </>
      )}
    </div>
  );
}
