import Button from "@echotab/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@echotab/ui/DropdownMenu";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

import { Theme, useUIStore } from "./UIStore";

export default function ThemeToggle() {
    const uiStore = useUIStore();

    const setTheme = (theme: Theme) => {
        uiStore.updateSettings({ theme });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme(Theme.Light)}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(Theme.Dark)}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(Theme.System)}>System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
