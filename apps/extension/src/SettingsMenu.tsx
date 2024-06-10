import Button from "@echotab/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@echotab/ui/Dialog";
import { BarChartIcon, GearIcon, PersonIcon } from "@radix-ui/react-icons";

import SettingsCommand from "./SettingsCommand";
import Stats from "./Stats";

import "@echotab/ui/globals.css";
import "./app.css";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";

export default function NavMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                    <GearIcon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <Dialog>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled>
                            <PersonIcon className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Tag Statistics</DialogTitle>
                        </DialogHeader>
                        <Stats />
                    </DialogContent>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <BarChartIcon className="mr-2 h-4 w-4" />
                            Tag Stats
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Tag Statistics</DialogTitle>
                        </DialogHeader>
                        <Stats />
                    </DialogContent>
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <GearIcon className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                        <SettingsCommand />
                    </DialogContent>
                </Dialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
