import { cn } from "@echotab/ui/util";
import { forwardRef, ReactNode } from "react";

interface Props {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
  desc?: ReactNode;
  children?: ReactNode;
}

const EchoItem = forwardRef<HTMLDivElement, Props>(function EchoItem(
  { title, desc, actions, className, icon, children, ...props },
  ref,
) {
  return (
    <div
      data-testid="echo-item"
      ref={ref}
      className={cn(
        "echo-item group/item border-t-border bg-card text-card-foreground @[250px]:flex @[250px]:gap-5 hover:border-border-active hover:bg-card-active [&:has(:focus-within)]:border-border-active [&:has(:focus-within)]:bg-card-active grid min-h-[50px] w-full grid-cols-[auto,1fr] items-center border p-2 shadow-sm transition-colors duration-200",
        className,
      )}
      {...props}>
      {icon && <div className="flex flex-shrink-0">{icon}</div>}
      <span className="echo-item-title group/title @[250px]:[&:not(:first-child)]:mt-0 @[250px]:max-w-[30cqw] col-[1/3] row-[2] overflow-hidden text-ellipsis whitespace-nowrap text-sm first:pl-2 [&:not(:first-child)]:mt-2">
        {title}
      </span>
      <span className="group/desc text-muted-foreground @[250px]:max-w-[25cqw] col-[1/3] row-[3] flex items-center gap-2 transition-colors duration-200">
        {desc}
      </span>
      {children}
      <div className="@[250px]:max-w-[45cqw] col-[2] ml-auto opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100">
        {actions}
      </div>
    </div>
  );
});

export default EchoItem;
