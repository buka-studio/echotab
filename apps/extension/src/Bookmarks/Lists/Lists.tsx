import { Badge } from "@echotab/ui/Badge";
import { Button } from "@echotab/ui/Button";
import { DialogTrigger } from "@echotab/ui/Dialog";
import { cn } from "@echotab/ui/util";
import { SquaresFourIcon } from "@phosphor-icons/react";
import { FilePlusIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";

import ExpandIcon from "~/components/ExpandIcon";
import { List } from "~/models";

import ItemListPlaceholder, { ItemListPlaceholderCopy } from "../../components/ItemListPlaceholder";
import { useBookmarkStore } from "../../store/bookmarkStore";
import ItemGrid from "../ItemGrid";
import ListFormDialog from "./ListFormDialog";
import ListItem from "./ListItem";
import { useGetPublicLists } from "./queries";

export default function Lists() {
  const lists = useBookmarkStore((s) => s.lists);

  const [expanded, setExpanded] = useState(true);

  const publicLists = useGetPublicLists();

  const publicListsById = useMemo(() => {
    return Object.fromEntries(publicLists.data?.map((list) => [list.localId, list]) ?? []);
  }, [publicLists.data]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center pl-2 text-sm select-none">
        <span className="mr-2 inline-flex gap-2">
          <span className="text-muted-foreground flex items-center gap-2">
            <SquaresFourIcon /> Collections
          </span>
          <Badge variant="card">{lists?.length}</Badge>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setExpanded(!expanded);
          }}>
          <ExpandIcon expanded={expanded} />
        </Button>
        <ListFormDialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className={cn("flex", "ml-auto")}>
              <FilePlusIcon className="mr-2 h-4 w-4" /> New Collection
            </Button>
          </DialogTrigger>
        </ListFormDialog>
      </div>

      {expanded && (
        <>
          {lists.length === 0 && (
            <ItemListPlaceholder
              layout="grid"
              count={5}
              className="[&_.items-placeholder]:max-h-[120px]">
              <ItemListPlaceholderCopy
                title="No bookmark lists yet."
                subtitle="Group and share bookmarks by creating lists."
              />
            </ItemListPlaceholder>
          )}
          <ItemGrid items={lists.map((l) => l.id)} className="dark:shadow-sm">
            {({ index }) => {
              const list = lists[index];

              if (!list) {
                return null;
              }

              return <ListItem list={list as List} publicList={publicListsById[list.id]} />;
            }}
          </ItemGrid>
        </>
      )}
    </div>
  );
}
