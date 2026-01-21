import { Input } from "@echotab/ui/Input";
import { useState } from "react";

export function TagNameInput({ name, onChange }: { name: string; onChange(name: string): void }) {
  const [value, setValue] = useState(name);

  return (
    <Input
      className="focus-visible:border-input hover:border-input h-7 rounded border-transparent px-2 py-1 text-sm shadow-none outline-none not-focus-visible:bg-transparent! focus-visible:ring-1"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onChange(value)}
    />
  );
}
