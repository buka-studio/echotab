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
import { ReactNode } from "react";

import { useActiveTabStore } from "./ActiveStore";

export default function WindowHeader({
    window,
    actions,
}: {
    window: {
        id: number;
        label: string;
    };
    actions?: ReactNode;
}) {
    const tabStore = useActiveTabStore();

    const tabIds = tabStore.viewTabIdsByWindowId[window.id];

    return (
        <div className="flex justify-between [&:not(:only-child)]:mb-4">
            <div className="inline-flex items-center gap-2 text-sm">
                {window.label} <Badge variant="card">{tabIds.length}</Badge>
                {actions}
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost">Close All</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will close all tabs in this window.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => tabStore.removeAllInWindow(window.id)}
                            variant="destructive">
                            Close All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
