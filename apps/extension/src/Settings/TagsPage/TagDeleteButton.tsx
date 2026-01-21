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
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import TagChip from "../../components/tag/TagChip";
import { Tag } from "../../models";

interface Props {
  tag: Tag;
  onDelete(): void;
  disabled?: boolean;
  tabCount: number;
}

export default function TagDeleteButton({ tag, onDelete, disabled, tabCount }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    if (tabCount > 0) {
      setDeleteDialogOpen(true);
    } else {
      onDelete();
    }
  };

  return (
    <>
      <ButtonWithTooltip
        side="top"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={handleDelete}
        tooltipText="Delete tag">
        <TrashIcon className="h-4 w-4" />
      </ButtonWithTooltip>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                This will delete{" "}
                <TagChip color={tag.color} className="inline-flex align-middle">
                  {tag.name}
                </TagChip>{" "}
                This action cannot be undone. If there are any tabs left without tags, they will be
                tagged as <TagChip className="inline-flex align-middle">Untagged</TagChip>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} variant="destructive">
              Delete Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
