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
import { ArrowTopRightIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { ComponentProps, ReactNode, useState } from "react";

import { List } from "~/models";

import { formatDate } from "../../util/date";
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
  const publicListURL = publicList ? getPublicListURL(publicList.publicId) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Collection</DialogTitle>
          <DialogDescription>Publish this collection to share it with others.</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="text-muted-foreground text-sm">
          {!publicList ? (
            <>
              <div className="">The collection will be available publicly after sharing!</div>
              <div>
                We recommend removing any sensitive information and/or links you don&apos;t want
                others to see.
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-5">
                <div className="text-muted-foreground flex items-center gap-2">
                  <EyeOpenIcon /> Views: {publicList?.viewCount}
                </div>

              </div>
              <div className="bg-card flex gap-4 rounded-md p-2">
                <div className="text-foreground text-sm">{publicList.title}</div>
                <div className="group flex items-center gap-1">
                  <a
                    href={publicListURL ?? ""}
                    target="_blank"
                    className="hover:underline focus-visible:underline focus-visible:outline-none">
                    {publicListURL}
                  </a>{" "}
                  <ArrowTopRightIcon className="h-4 w-4 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100" />{" "}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  Last published: {formatDate(list.updatedAt)}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {publicList?.published && (
            <Button
              variant="destructive"
              className="mr-auto"
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
          <DialogClose asChild>
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
