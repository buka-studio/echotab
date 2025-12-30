import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@echotab/ui/AlertDialog";
import { Button } from "@echotab/ui/Button";
import { Input } from "@echotab/ui/Input";
import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import TagChip from "../../components/tag/TagChip";
import { Tag } from "../../models";
import TagColorPicker from "./TagColorPicker";

function TagNameInput({ name, onChange }: { name: string; onChange(name: string): void }) {
  const [value, setValue] = useState(name);

  return (
    <Input
      className="focus-visible:border-input hover:border-input h-7 rounded border-transparent bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-1"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onChange(value)}
    />
  );
}

function DeleteConfirmDialog({
  tag,
  onConfirm,
  children,
  open,
  onOpenChange,
}: {
  tag: Tag;
  onConfirm: () => void;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children}
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
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Delete Tag
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface Props {
  tag: Tag;
  onDelete(): void;
  onChange(update: Partial<Pick<Tag, "name" | "color">>): void;
  disabled?: boolean;
  tabCount: number;
}

export default function TagControl({ tag, onDelete, onChange, disabled, tabCount }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    if (tabCount > 0) {
      setDeleteDialogOpen(true);
    } else {
      onDelete();
    }
  };

  return (
    <div className="flex w-full items-center gap-2 px-1">
      <TagNameInput key={tag.name} name={tag.name} onChange={(name) => onChange({ name })} />
      <div className="ml-auto flex items-center gap-4">
        <TagColorPicker value={tag.color} onChange={(color) => onChange({ color })} />
        <Button variant="ghost" size="icon-sm" disabled={disabled} onClick={handleDelete}>
          <TrashIcon className="h-4 w-4" />
        </Button>
        <DeleteConfirmDialog
          tag={tag}
          onConfirm={onDelete}
          open={deleteDialogOpen}
          onOpenChange={() => setDeleteDialogOpen(false)}>
          <AlertDialogTrigger asChild></AlertDialogTrigger>
        </DeleteConfirmDialog>
      </div>
    </div>
  );
}
