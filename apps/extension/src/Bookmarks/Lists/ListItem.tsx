import { UserList } from "@echotab/lists/models";
import { AlertDialogTrigger } from "@echotab/ui/AlertDialog";
import { Button } from "@echotab/ui/Button";
import { DialogTrigger } from "@echotab/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@echotab/ui/HoverCard";
import { RichTextRenderer } from "@echotab/ui/RichEditor";
import { cn } from "@echotab/ui/util";
import { ArrowTopRightIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { ComponentProps } from "react";

import EchoItem from "../../components/EchoItem";
import { List } from "../../models";
import { pluralize } from "../../util";
import ListDeleteDialog from "./ListDeleteDialog";
import ListFormDialog from "./ListFormDialog";
import ListPublishDialog from "./ListPublishDialog";
import PublishIndicator from "./PublishIndicator";
import { getPublicListURL } from "./util";

function ListMenu({ list, publicList }: { list: List; publicList?: UserList }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="pointer-events-auto" variant="ghost" size="icon-sm">
          <DotsVerticalIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ListFormDialog list={list}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
          </DialogTrigger>
        </ListFormDialog>
        <ListPublishDialog list={list} publicList={publicList}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Publish</DropdownMenuItem>
          </DialogTrigger>
        </ListPublishDialog>
        <DropdownMenuSeparator />
        <ListDeleteDialog list={list} publicList={publicList}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
          </AlertDialogTrigger>
        </ListDeleteDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type Props = {
  list: List;
  publicList?: UserList;
} & Partial<ComponentProps<typeof EchoItem>>;

function ListItem({ list, publicList, className, ref, ...props }: Props) {
  const label = pluralize(list.tabIds.length, "bookmark");

  return (
    <EchoItem
      title={
        <ListFormDialog list={list}>
          <DialogTrigger className="cursor-pointer [all:inherit] hover:cursor-pointer hover:underline focus-visible:underline">
            {list.title}
          </DialogTrigger>
        </ListFormDialog>
      }
      desc={
        <>
          <PublishIndicator list={list} publicList={publicList} className="mr-1" />
          <HoverCard openDelay={1000}>
            <HoverCardTrigger asChild>
              {publicList?.published ? (
                <a
                  target="_blank"
                  href={getPublicListURL(publicList.publicId)}
                  className="focus-visible:underline focus-visible:outline-none">
                  {label}
                </a>
              ) : (
                <span className="focus-visible:underline focus-visible:outline-none">{label}</span>
              )}
            </HoverCardTrigger>
            {publicList?.published && (
              <ArrowTopRightIcon className="icon h-4 w-4 shrink-0 opacity-0 transition-opacity duration-150 group-hover/desc:opacity-100" />
            )}
            <HoverCardContent className="h-[300px] w-[350px] overflow-hidden p-3">
              <RichTextRenderer editorState={list.content} />
            </HoverCardContent>
          </HoverCard>
        </>
      }
      ref={ref}
      className={cn(
        "tab-item [&_.echo-item-title]:pl-0 [&_.echo-item-title]:whitespace-normal [&_.echo-item-title:first-child]:line-clamp-2",
        className,
      )}
      actions={
        <div className="to-card-active pointer-events-none absolute top-px right-px z-1 h-[calc(100%-1px)] bg-linear-to-r from-transparent to-50% p-1 pl-8">
          <ListMenu list={list} publicList={publicList} />
        </div>
      }
      {...props}
    />
  );
}

export default ListItem;
