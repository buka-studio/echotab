import { UserList } from "@echotab/lists/models";
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
import { Checkbox } from "@echotab/ui/Checkbox";
import { Label } from "@echotab/ui/Label";
import { Spinner } from "@echotab/ui/Spinner";
import { useMutation } from "@tanstack/react-query";
import { ReactNode, useRef } from "react";

import { List } from "../../models";
import BookmarkStore from "../BookmarkStore";
import { updateList } from "./api";

interface Props {
  list: List;
  publicList?: UserList;
  children: ReactNode;
}

export default function ListDeleteDialog({ list, children, publicList }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const unpublish = (formRef.current?.elements?.[0] as HTMLInputElement)?.checked;
      if (unpublish) {
        await updateList(list.id, { published: false });
      }

      BookmarkStore.removeList(list.id);
    },
  });

  return (
    <AlertDialog>
      {children}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the collection.
          </AlertDialogDescription>
          {publicList?.published && (
            <form ref={formRef}>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox id="unpublish" defaultChecked={true} />
                <Label htmlFor="unpublish">Unpublish</Label>
              </div>
              <div className="text-muted-foreground text-xs">
                If checked, the public list copy will also be deleted.
              </div>
            </form>
          )}
          {deleteMutation.isPending}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            variant="destructive"
            disabled={deleteMutation.isPending}>
            {deleteMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
