import { UserList } from "@echotab/lists/models";
import { AlertDialogTrigger } from "@echotab/ui/AlertDialog";
import Button from "@echotab/ui/Button";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { ArrowTopRightIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { ComponentProps, forwardRef } from "react";

import EchoItem from "../../components/EchoItem";
import { List } from "../../models";
import { useUIStore } from "../../UIStore";
import { pluralize } from "../../util";
import ListDeleteDialog from "./ListDeleteDialog";
import ListFormDialog from "./ListFormDialog";
import ListPublishDialog from "./ListPublishDialog";
import { getPublicListURL } from "./util";

function PublishIndicator({ list, publicList }: { list: List; publicList?: UserList }) {
  const {
    settings: { disableListSharing },
  } = useUIStore();

  if (!import.meta.env.PLASMO_PUBLIC_LIST_SHARING_FF) {
    return null;
  }

  const isUpToDate = publicList && publicList.published && publicList.content === list.content;
  const isOutdated = publicList && publicList.published && publicList.content !== list.content;
  const isUnpublished = !publicList || !publicList.published;

  const publishLabel = disableListSharing
    ? "List sharing is disabled."
    : isUnpublished
      ? "This list is not published."
      : isOutdated
        ? "Published list is outdated."
        : "Published list is up to date.";

  return (
    <Tooltip>
      <TooltipTrigger className="focus-ring rounded-full">
        <div
          className={cn(
            "text-muted-foreground h-2 w-2 rounded-full bg-current transition-all duration-200",
            disableListSharing
              ? undefined
              : {
                  "text-muted-foreground": isUnpublished,
                  "text-warning": isOutdated,
                  "text-success": isUpToDate,
                },
          )}
        />
      </TooltipTrigger>
      <TooltipContent className="text-left">{publishLabel}</TooltipContent>
    </Tooltip>
  );
}

function ListMenu({ list, publicList }: { list: List; publicList?: UserList }) {
  const {
    settings: { disableListSharing },
  } = useUIStore();

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
        {import.meta.env.PLASMO_PUBLIC_LIST_SHARING_FF && (
          <ListPublishDialog list={list} publicList={publicList}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={disableListSharing}>
                Publish
              </DropdownMenuItem>
            </DialogTrigger>
          </ListPublishDialog>
        )}
        <DropdownMenuSeparator />
        <ListDeleteDialog list={list}>
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

const ListItem = forwardRef<HTMLDivElement, Props>(function ListItem(
  { list, publicList, className, ...props },
  ref,
) {
  const label = pluralize(list.tabIds.length, "link");

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
          <PublishIndicator list={list} publicList={publicList} />
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
              <ArrowTopRightIcon className="icon h-4 w-4 flex-shrink-0 opacity-0 transition-opacity duration-150 group-hover/desc:opacity-100" />
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
        <div className="to-card-active pointer-events-none absolute top-[1px] right-[1px] z-1 h-[calc(100%-1px)] bg-gradient-to-r from-transparent to-50% p-1 pl-8">
          <ListMenu list={list} publicList={publicList} />
        </div>
      }
      {...props}
    />
  );
});

export default ListItem;
