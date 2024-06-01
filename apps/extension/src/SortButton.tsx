import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";

import { SortDir } from "./util/sort";

interface Props {
    active: boolean;
    dir: SortDir;
    onClick(): void;
}

export default function SortButton({ active, dir, onClick }: Props) {
    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            className={cn({ "text-primary": active })}>
            {!active || dir === SortDir.Asc ? (
                <ArrowUpIcon className="h-4 w-4" />
            ) : (
                <ArrowDownIcon className="h-4 w-4" />
            )}
        </Button>
    );
}
