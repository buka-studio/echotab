import { ScrollArea } from "@echotab/ui/ScrollArea";
import { cn } from "@echotab/ui/util";

export function SettingsPage({ children }: { children: React.ReactNode }) {
  return (
    <ScrollArea
      fade="mask"
      className="col-start-2 row-[1/3] h-full max-h-[450px] flex-1 overflow-auto border-l">
      <div className="flex flex-col gap-5">{children}</div>
    </ScrollArea>
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
    <div className="border-border flex max-h-[60px] w-full items-center justify-between gap-2 border-b p-5 px-5">
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
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}
