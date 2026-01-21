import { cn } from "@echotab/ui/util";
import { ArrowsInLineVerticalIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { ComponentProps } from "react";

export default function ExpandIcon({
  expanded,
  className,
  ...props
}: { expanded?: boolean } & ComponentProps<typeof ArrowsInLineVerticalIcon>) {
  return !expanded ? (
    <CaretDownIcon className={cn("size-3.5", className)} {...props} />
  ) : (
    <CaretUpIcon className={cn("size-3.5", className)} {...props} />

  //   <svg
  //     {...props}
  //     className={cn("size-3.5", className)}
  //     xmlns="http://www.w3.org/2000/svg"
  //     width="24"
  //     height="24"
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     stroke="currentColor"
  //     strokeWidth="1.5"
  //     strokeLinecap="round"
  //     strokeLinejoin="round">
  //     <path d="m7 15 5 5 5-5" />
  //     <path d="m7 9 5-5 5 5" />
  //   </svg>
  // ) : (
  //   <svg
  //     {...props}
  //     className={cn("size-3.5", className)}
  //     xmlns="http://www.w3.org/2000/svg"
  //     width="24"
  //     height="24"
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     stroke="currentColor"
  //     strokeWidth="1.5"
  //     strokeLinecap="round"
  //     strokeLinejoin="round">
  //     <path d="m7 20 5-5 5 5" />
  //     <path d="m7 4 5 5 5-5" />
  //   </svg>
  );
}
