import { UserList } from "@echotab/lists/models";
import Button from "@echotab/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@echotab/ui/Dialog";
import { Label } from "@echotab/ui/Label";
import Spinner from "@echotab/ui/Spinner";
import Switch from "@echotab/ui/Switch";
import {
  ArrowTopRightIcon,
  BookmarkIcon,
  EyeOpenIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { ComponentProps, ReactNode, useRef, useState } from "react";

import { List } from "~/src/models";

import { formatDate } from "../../util/date";
import BookmarkStore from "../BookmarkStore";
import { usePublishListMutation, useUnpublishMutation, useUpdateListMutation } from "./queries";
import { getPublicListURL } from "./util";

type Props = {
  list: List;
  children?: ReactNode;
  publicList?: UserList;
} & ComponentProps<typeof Dialog>;

export default function ListPublishDialog({ list, children, publicList }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

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

  const unpublishMutation = useUnpublishMutation(list.id, {
    onSuccess: () => {
      setOpen(false);
    },
  });

  const handleFormChange = () => {
    const formData = new FormData(formRef.current!);
    const sync = formData.get("sync") === "on";

    BookmarkStore.upsertList({ ...list, sync });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish List</DialogTitle>
          <DialogDescription>Publish this list to share it with others.</DialogDescription>
        </DialogHeader>
        <div>
          <div className="border-border text-muted-foreground rounded border border-dashed p-4">
            <InfoCircledIcon className="mr-1 inline text-balance" /> Note: the list will be
            available publicly after sharing. We recommend removing any sensitive information and/or
            links you don&apos;t want others to see.
          </div>
          <form ref={formRef} onChange={handleFormChange}>
            <div className="mt-3 flex items-center space-x-2">
              <Switch id="sync" name="sync" defaultChecked={list.sync} />
              <Label htmlFor="sync">Sync updates</Label>
            </div>
            <div className="text-muted-foreground mt-2 text-xs">
              If checked, the published list will be updated automatically when you make changes.
            </div>
          </form>

          {publicList && (
            <div className="mt-4 flex items-start justify-between border-t pt-4">
              <div>
                <div className="text-muted-foreground">
                  Last published: {formatDate(list.updatedAt)}
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <EyeOpenIcon /> Views: {publicList?.viewCount}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <BookmarkIcon />
                    Imports: {publicList?.importCount}
                  </div>
                </div>
              </div>
              <Button asChild variant="link">
                <a
                  className="flex items-center text-base"
                  target="_blank"
                  href={getPublicListURL(publicList.publicId)}>
                  Visit <ArrowTopRightIcon className="ml-2 h-4 w-4" />{" "}
                </a>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {publicList?.published && (
            <Button
              variant="ghost"
              className="mr-auto"
              onClick={() => unpublishMutation.mutate()}
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
              variant="outline"
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
