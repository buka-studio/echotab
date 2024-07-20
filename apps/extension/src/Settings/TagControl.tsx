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
import Button from "@echotab/ui/Button";
import Input from "@echotab/ui/Input";
import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import TagChip from "../components/TagChip";
import { Tag } from "../models";
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

interface Props {
  tag: Tag;
  onDelete(): void;
  onChange(update: Partial<Pick<Tag, "name" | "color">>): void;
  disabled?: boolean;
}

export default function TagControl({ tag, onDelete, onChange, disabled }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <div className="flex w-full items-center gap-2 px-1">
      <TagNameInput key={tag.name} name={tag.name} onChange={(name) => onChange({ name })} />
      <div className="ml-auto flex items-center gap-4">
        <TagColorPicker color={tag.color} onChange={(color) => onChange({ color })} />
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => setDeleteDialogOpen(true)}>
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                This will delete{" "}
                <TagChip color={tag.color} className="inline-flex">
                  {tag.name}
                </TagChip>
                . This action cannot be undone. If there are any tabs left without tags, they will
                be tagged as <TagChip className="inline-flex">Untagged</TagChip>.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} variant="destructive">
              Delete Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}