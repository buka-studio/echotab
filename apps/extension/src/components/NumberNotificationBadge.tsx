import { BadgeProps } from "@echotab/ui/Badge";
import { cn } from "@echotab/ui/util";

import { AnimatedNumberBadge } from "./AnimatedNumberBadge";

export interface NumberNotificationBadgeProps extends BadgeProps {
  value?: number;
  show?: boolean;
}

export const NumberNotificationBadge = ({
  value,
  className,
  show,
  children,
  ...props
}: NumberNotificationBadgeProps) => {
  const showBadge = typeof value !== "undefined" && (typeof show === "undefined" || show);

  return (
    <div className="relative inline-flex">
      {children}
      {showBadge && (
        <AnimatedNumberBadge
          className={cn(
            "absolute right-0 top-0 rounded-full",
            typeof value !== "undefined" && ("" + value).length === 0
              ? "-translate-y-1 translate-x-1 px-1.5 py-1.5"
              : "-translate-y-1.5 translate-x-1.5 px-2",
            className,
          )}
          value={value}
          {...props}
        />
      )}
    </div>
  );
};
