import { CommandGroup, CommandItem } from "@echotab/ui/Command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@echotab/ui/Dialog";
import GlowOutline from "@echotab/ui/GlowOutline";
import { cn } from "@echotab/ui/util";
import { useCommandState } from "cmdk";
import {
  ComponentProps,
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { capitalize, pluralize } from "../util";

const DialogStateContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function useDialogState() {
  return useContext(DialogStateContext);
}

export function OnClose({ callback }: { callback: () => void }) {
  const { open } = useDialogState();

  useEffect(() => {
    if (!open) {
      callback();
    }
  }, [open]);

  return null;
}

export function useTabCommand<T extends string>() {
  const [pages, setPages] = useState<T[]>(["/"] as T[]);
  const [search, setSearch] = useState("");
  const activePage = pages.at(-1)!;

  const goToPage = (page: T) => {
    const idx = pages.findIndex((p) => p === page);
    setPages(pages.slice(0, idx + 1));
  };

  const pushPage = (page: T) => {
    if (pages.at(-1) === page) {
      return;
    }
    setPages([...pages, page]);
    setSearch("");
  };

  const replacePage = (page: T) => {
    setPages((pages) => {
      return [...pages.slice(0, -1), page];
    });
  };

  const goToPrevPage = () => {
    setPages((pages) => {
      if (pages.length > 1) {
        return pages.slice(0, -1);
      }
      return pages;
    });
  };

  return {
    pages,
    activePage,
    setPages,
    replacePage,
    search,
    setSearch,
    goToPage,
    pushPage,
    goToPrevPage,
  };
}

export function TabCommandItem({
  children,
  className,
  ...props
}: ComponentProps<typeof CommandItem>) {
  return (
    <CommandItem
      variant="primary"
      className={cn("min-h-10 rounded-none pl-5", "", className)}
      {...props}>
      {children}
    </CommandItem>
  );
}

export function TabCommandFooter({
  pages,
  resultsCount: overrideResultsCount = undefined,
  className,
}: {
  pages: string[];
  resultsCount?: number;
  className?: string;
}) {
  const resultsCount = useCommandState((state) => state.filtered.count);

  return (
    <div
      className={cn(
        "text-muted-foreground bg-accent/50 flex justify-between rounded-b-[calc(var(--radius)-1px)] border-t-[0.5px] p-2 text-xs",
        className,
      )}>
      {pages.length > 1 ? (
        <span>
          <kbd className="keyboard-shortcut small text-[0.625rem]!">Backspace</kbd> to go back
        </span>
      ) : (
        <span>
          Use <kbd className="keyboard-shortcut small">↑</kbd>{" "}
          <kbd className="keyboard-shortcut small">↓</kbd> to navigate
        </span>
      )}
      <span className="ml-auto">
        {pluralize(overrideResultsCount ?? resultsCount, "result", "s")}
      </span>
    </div>
  );
}

export function TabCommandGroup({
  children,
  className,
  ...props
}: ComponentProps<typeof CommandGroup>) {
  return (
    <CommandGroup className={cn("px-0 py-0 [&_[cmdk-group-heading]]:px-5", className)} {...props}>
      {children}
    </CommandGroup>
  );
}

export function CommandPagination<T extends string>({
  className,
  pages,
  goToPage,
  ...props
}: ComponentProps<"div"> & { pages: T[]; goToPage: (page: T) => void }) {
  return (
    <div className={cn("pages flex items-center empty:hidden", className)} {...props}>
      {pages.flatMap((p, i) => {
        if (p === "/") {
          return [];
        }
        const path = [
          <button
            className={cn("focus-ring rounded-md", {
              "text-muted-foreground text-lg": i === 0,
            })}
            key={p}
            disabled={i === pages.length - 1}
            onClick={() => goToPage(p)}>
            {capitalize(p)}
          </button>,
        ];
        if (i < pages.length) {
          path.push(
            <span className="ml-2 font-bold opacity-50 not-last:mr-2" key={p + i}>
              /
            </span>,
          );
        }
        return path;
      })}
    </div>
  );
}

export type TabCommandDialogRef = {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
};

export function TabCommandDialog({
  children,
  label = "Command Menu",
  dialogRef,
}: {
  children: React.ReactNode;
  label?: React.ReactNode;
  dialogRef?: React.RefObject<TabCommandDialogRef | null>;
}) {
  const [open, setOpen] = useState(false);

  const openDialog = () => {
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        openDialog();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useImperativeHandle(dialogRef, () => ({
    open: openDialog,
    close: closeDialog,
    isOpen: () => open,
  }));

  const [commandContainer, setCommandContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div ref={setCommandContainer} className={cn("relative flex w-full rounded-lg dark:shadow-sm")}>
      <button
        className={cn(
          "focus-ring hover:bg-card-active bg-card flex flex-1 items-center justify-between rounded-lg border p-3 text-base shadow-[0_0_0_2px_hsl(var(--border))] backdrop-blur-lg transition-all duration-0",
          {
            "opacity-0 duration-200": open,
          },
        )}
        onClick={openDialog}>
        <span>{label}</span>
        <span className="flex items-center gap-1">
          <span className="keyboard-shortcut flex h-6 w-6 items-center justify-center text-lg">
            ⌘
          </span>
          <span className="keyboard-shortcut flex h-6 w-6 items-center justify-center">K</span>
        </span>
      </button>
      <GlowOutline className="rounded-lg" />
      <Dialog scrollLock={false} open={open} onOpenChange={closeDialog}>
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only"></DialogDescription>
        <DialogContent
          container={commandContainer!}
          overlay={false}
          close={false}
          className="data-[state=open]:zoom-in-[96%] data-[state=closed]:zoom-out-[100%] absolute -top-px max-w-none translate-y-0 transform-gpu overflow-visible p-0 duration-100 data-[state=open]:border-transparent data-[state=open]:bg-transparent data-[state=open]:shadow-none md:max-w-[57rem]">
          <DialogStateContext.Provider value={{ open, setOpen }}>
            {children}
          </DialogStateContext.Provider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
