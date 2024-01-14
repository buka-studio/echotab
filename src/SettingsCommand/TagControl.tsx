import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { Tag } from "../models";
import Button from "../ui/Button";
import TagColorPicker from "./TagColorPicker";

function TagNameInput({ name, onChange }: { name: string; onChange(name: string): void }) {
    const [value, setValue] = useState(name);

    return (
        <input
            className="bg-transparent text-sm outline-none"
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
    return (
        <div className="flex w-full items-center px-1">
            <TagNameInput key={tag.name} name={tag.name} onChange={(name) => onChange({ name })} />
            <div className="ml-auto flex items-center gap-4">
                <TagColorPicker color={tag.color} onChange={(color) => onChange({ color })} />
                <Button variant="ghost" size="icon-sm" disabled={disabled} onClick={onDelete}>
                    <TrashIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
