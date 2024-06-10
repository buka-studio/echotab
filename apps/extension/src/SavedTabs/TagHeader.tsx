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
import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { ReactNode } from "react";

import { Tag } from "../models";
import { useTagStore } from "../TagStore";
import { useSavedTabStore } from "./SavedStore";

export default function TagHeader({
    tag,
    actions,
    highlighted,
}: {
    tag: Tag;
    actions?: ReactNode;
    highlighted?: boolean;
}) {
    const tabStore = useSavedTabStore();
    const tagStore = useTagStore();

    const tabIds = tabStore.filteredTabsByTagId[tag?.id];
    if (!tagStore.tags.has(Number(tag?.id))) {
        return null;
    }
    return (
        <div className="flex justify-between">
            <div className="select-none">
                <span className="mr-2 inline-flex gap-2">
                    <span
                        className={cn(
                            "text-muted-foreground text-sm transition-colors duration-300",
                            {
                                "text-primary": highlighted,
                            },
                        )}>
                        {tagStore.tags.get(Number(tag.id))!.name}
                    </span>
                    <Badge variant="card">{tabIds?.length}</Badge>
                </span>
                {actions}
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="select-none">
                        Remove Tabs
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove all tabs in this group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => tabStore.removeTabs(tabIds)}
                            variant="destructive">
                            Remove Tabs
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
