import { UserList } from "@echotab/lists/models";
import { Button } from "@echotab/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@echotab/ui/Dialog";
import { Separator } from "@echotab/ui/Separator";
import { Spinner } from "@echotab/ui/Spinner";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ComponentProps, CSSProperties, ReactNode, useState } from "react";

import { List } from "~/models";

import { formatDate } from "../../util/date";
import Illustration from "./Illustration";
import PublishIndicator from "./PublishIndicator";
import { usePublishListMutation, useUnpublishMutation, useUpdateListMutation } from "./queries";
import { getPublicListURL } from "./util";

type Props = {
  list: List;
  children?: ReactNode;
  publicList?: UserList;
} & ComponentProps<typeof Dialog>;

export default function ListPublishDialog({ list, children, publicList }: Props) {
  const [open, setOpen] = useState(false);

  const publishMutation = usePublishListMutation();
  const handlePublishList = () => {
    publishMutation.mutate(list, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  const updateMutation = useUpdateListMutation();
  const handleUpdateList = () => {
    updateMutation.mutate(list, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  const unpublishMutation = useUnpublishMutation();

  const isOutdated = useMemo(
    () => publicList && publicList.content !== list.content,
    [publicList, list],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Collection</DialogTitle>
          <DialogDescription>
            {isOutdated
              ? "This collection has unpublished changes. Republish to make the latest updates visible."
              : "Publish this collection to share it with others."}
          </DialogDescription>
        </DialogHeader>
        <div className="text-muted-foreground mb-4 text-sm">
          {!publicList ? (
            <UnpublishedListContent />
          ) : (
            <PublishedListContent list={list} publicList={publicList} />
          )}
        </div>

        <DialogFooter>
          {publicList?.published && (
            <Button
              variant="destructive"
              className="sm:mr-auto"
              onClick={() =>
                unpublishMutation.mutate(list.id, {
                  onSuccess: () => {
                    setOpen(false);
                  },
                })
              }
              disabled={unpublishMutation.isPending}>
              {unpublishMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Unpublish
            </Button>
          )}
          <DialogClose asChild className="-order-1 sm:order-[initial] sm:block">
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          {publicList ? (
            <Button
              variant="outline"
              onClick={handleUpdateList}
              disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              {publicList.published ? "Update" : "Republish"}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handlePublishList}
              disabled={publishMutation.isPending}>
              {publishMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Publish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnpublishedListContent() {
  return (
    <div className="relative mt-5 grid grid-cols-1 items-center justify-center justify-items-center gap-5 sm:grid-cols-[3fr_7fr]">
      <Illustration
        className="max-h-[100px]"
        style={
          {
            "--background": "var(--background-base)",
            "--dot": "var(--primary)",
            "--foreground-muted": "var(--border)",
            "--foreground": "var(--muted-foreground)",
            "--skeleton": "var(--border-active)",
            "--skeleton-muted": "var(--card)",
          } as CSSProperties
        }
      />
      <div className="relative z-1 text-left">
        The collection will be available publicly after sharing. We recommend removing any sensitive
        information and/or links you don&apos;t want others to see.
      </div>
    </div>
  );
}

function PublishedListContent({ list, publicList }: { list: List; publicList: UserList }) {
  const publicListURL = getPublicListURL(publicList.publicId);

  return (
    <div className="bg-card flex flex-col gap-2 rounded-md px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PublishIndicator list={list} publicList={publicList} disabled />
          <div className="text-foreground text-sm">{publicList.title}</div>
        </div>

        {publicList.published && (
          <Button variant="link" asChild>
            <a
              href={publicListURL ?? ""}
              target="_blank"
              className="hover:underline focus-visible:underline focus-visible:outline-none">
              Visit link <ArrowTopRightIcon />
            </a>
          </Button>
        )}
      </div>
      <Separator />
      <div>
        <div className="text-muted-foreground flex items-center gap-2">
          Last published: {formatDate(publicList.updated_at)}{" "}
          <span className="opacity-50"> | </span>
          Views: {publicList.viewCount}
        </div>
      </div>
    </div>
  );
}
