import { Dialog, DialogContent, DialogTitle } from "@echotab/ui/Dialog";
import GlowOutline from "@echotab/ui/GlowOutline";
import { cn } from "@echotab/ui/util";
import {
  ComponentProps,
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { capitalize } from "../util";

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
  const activePage = pages[pages.length - 1];

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

export function CommandPagination<T extends string>({
  className,
  pages,
  goToPage,
  ...props
}: ComponentProps<"div"> & { pages: T[]; goToPage: (page: T) => void }) {
  return (
    <div className={cn("pages flex items-center gap-1 px-1", className)} {...props}>
      {pages.flatMap((p, i) => {
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
        if (i < pages.length - 1 && i > 0) {
          path.push(
            <span className="" key={p + i}>
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
  dialogRef?: React.RefObject<TabCommandDialogRef>;
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
    <div ref={setCommandContainer} className={cn("relative flex w-full")}>
      <button
        className={cn(
          "focus-ring bg-card/40 flex flex-1 items-center justify-between rounded-lg border p-3 text-base shadow-[0_0_0_2px_hsl(var(--border))] backdrop-blur-lg transition-all duration-200",
          {
            "opacity-0": open,
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
        <DialogContent
          container={commandContainer!}
          overlay={false}
          close={false}
          className="data-[state=closed]:slide-out-to-top-[10px] data-[state=open]:slide-in-from-top-[10px] absolute top-[-1px] max-w-[57rem] translate-y-0 overflow-visible p-0 data-[state=open]:border-transparent data-[state=open]:bg-transparent data-[state=open]:shadow-none">
          <DialogStateContext.Provider value={{ open, setOpen }}>
            {children}
          </DialogStateContext.Provider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
