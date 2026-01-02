import { ScrollArea } from "@echotab/ui/ScrollArea";
import { cn } from "@echotab/ui/util";

export function SettingsPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-start-2 row-[1/3] flex h-full flex-1 flex-col overflow-auto border-l">
      {children}
    </div>
  );
}

export function SettingsTitle({
  children,
  className,
  right,
}: {
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex max-h-[60px] w-full items-center justify-between gap-2 border-b border-transparent p-5 px-3 sm:px-5">
      <h1 className={cn("text-base font-semibold", className)}>{children}</h1>
      {right}
    </div>
  );
}

export function SettingsContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ScrollArea fade="mask" className={cn("h-full flex-1 overflow-auto")}>
      <div className={cn("flex flex-col gap-5 px-3 pt-5 pb-5 sm:px-5", className)}>{children}</div>
    </ScrollArea>
  );
}
