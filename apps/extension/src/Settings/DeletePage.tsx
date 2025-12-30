import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@echotab/ui/AlertDialog";
import { Button } from "@echotab/ui/Button";
import { toast } from "@echotab/ui/Toast";
import { useState } from "react";

import { BookmarkStore } from "../Bookmarks";
import CurateStore from "../Curate/CurateStore";
import TagStore from "../TagStore";
import SnapshotStore from "../util/SnapshotStore";

export default function MiscPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleConfirmDelete = async () => {
    BookmarkStore.removeAllItems();
    TagStore.deleteAllTags();
    CurateStore.removeAllItems();

    const snapshotStore = await SnapshotStore.init();
    await snapshotStore.clearSnapshots().catch(() => {
      toast.error("Failed to delete snapshots");
    });
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="text-muted-foreground text-sm">
          Delete all your echotab data. It&apos;s recommended to export your data before deleting it
          as this action cannot be undone.
        </div>
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          Delete
        </Button>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your saved tabs and tags from this computer. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} variant="destructive">
              Delete Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
