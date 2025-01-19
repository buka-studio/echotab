import { Badge, BadgeProps } from "@echotab/ui/Badge";
import { NumberFlow } from "@echotab/ui/NumberFlow";
import { cn } from "@echotab/ui/util";

type AnimatedNumberBadgeProps = Omit<BadgeProps, "children"> & {
  value: number;
};

export function AnimatedNumberBadge({
  value,
  className,
  variant = "card",
  ...props
}: AnimatedNumberBadgeProps) {
  return (
    <Badge variant={variant} className={cn(className)} {...props}>
      <NumberFlow value={value} />
    </Badge>
  );
}
