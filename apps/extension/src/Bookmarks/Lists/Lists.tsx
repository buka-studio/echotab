import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import { DialogTrigger } from "@echotab/ui/Dialog";
import { cn } from "@echotab/ui/util";
import { CaretSortIcon, FilePlusIcon, FileTextIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";

import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../../components/ItemListPlaceholder";
import { useBookmarkStore } from "../BookmarkStore";
import ItemGrid from "../ItemGrid";
import ListFormDialog from "./ListFormDialog";
import ListItem from "./ListItem";
import { useGetPublicLists } from "./queries";

export default function Lists() {
  const bookmarkStore = useBookmarkStore();

  const [expanded, setExpanded] = useState(true);

  const publicLists = useGetPublicLists();

  const publicListsById = useMemo(() => {
    return Object.fromEntries(publicLists.data?.map((list) => [list.localId, list]) ?? []);
  }, [publicLists.data]);

  return (
    <div>
      <div className="mb-2 flex select-none items-center text-sm">
        <span className="inline-flex gap-2 px-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <FileTextIcon /> Lists
          </span>
          <Badge variant="card">{bookmarkStore.lists?.length}</Badge>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setExpanded(!expanded);
          }}>
          <CaretSortIcon className="h-4 w-4" />
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
              className="[&_.items-placeholder]:max-h-[120px]">
              <ItemListPlaceholderCopy
                title="No link lists yet."
                subtitle='Create a new list by clicking "New List" or by selecting saved links.'
              />
            </ItemListPlaceholder>
          )}
          <ItemGrid items={bookmarkStore.lists.map((l) => l.id)}>
            {({ index }) => {
              const list = bookmarkStore.lists[index];

              return <ListItem list={list} publicList={publicListsById[list.id]} />;
            }}
          </ItemGrid>
        </>
      )}
    </div>
  );
}
