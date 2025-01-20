import { cn } from "@echotab/ui/util";

export function KeyboardShortcut({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <span className={cn("flex items-center gap-1", className)}>{children}</span>;
}

export function KeyboardShortcutKey({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("keyboard-shortcut flex h-6 items-center justify-center", className)}>
      {children}
    </span>
  );
}
