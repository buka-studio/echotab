import { cn } from "@echotab/ui/util";
import { ReactNode, Ref } from "react";

interface Props {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
  desc?: ReactNode;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

function EchoItem({ title, desc, actions, className, icon, children, ref, ...props }: Props) {
  return (
    <div
      data-testid="echo-item"
      ref={ref}
      className={cn(
        "echo-item group/item border-t-border bg-card text-card-foreground hover:border-border-active hover:bg-card-active [&:has(:focus-within)]:border-border-active [&:has(:focus-within)]:bg-card-active grid min-h-[50px] w-full grid-cols-[auto,1fr] items-center border p-2 transition-colors duration-100 @[250px]:flex @[250px]:gap-5 dark:shadow-sm",
        className,
      )}
      {...props}>
      {icon && <div className="echo-item-icon flex shrink-0">{icon}</div>}
      <span className="echo-item-title group/title col-[1/3] row-2 overflow-hidden text-sm text-ellipsis whitespace-nowrap not-first:mt-2 @[250px]:max-w-[30cqw] @[250px]:not-first:mt-0 @[250px]:first:pl-2">
        {title}
      </span>
      <span className="group/desc text-muted-foreground col-[1/3] row-3 flex max-w-[calc(100cqw-16px)] items-center gap-1 transition-colors duration-100 @[250px]:max-w-[25cqw]">
        {desc}
      </span>
      {children}
      <div className="col-2 ml-auto opacity-0 group-focus-within/item:opacity-100 group-hover/item:opacity-100 @[250px]:max-w-[45cqw]">
        {actions}
      </div>
    </div>
  );
}

export default EchoItem;
