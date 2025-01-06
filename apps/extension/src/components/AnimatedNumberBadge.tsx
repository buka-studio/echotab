import { Badge } from "@echotab/ui/Badge";
import { NumberFlow } from "@echotab/ui/NumberFlow";
import { cn } from "@echotab/ui/util";

export function AnimatedNumberBadge({ value, className }: { value: number; className?: string }) {
  return (
    <Badge variant="card" className={cn(className)}>
      <NumberFlow value={value} />
    </Badge>
  );
}
