import { cloneElement, ReactNode } from "react";

export function ConditionalWrapper({
  condition,
  wrapper,
  children,
}: {
  condition: boolean;
  wrapper: (children: ReactNode) => JSX.Element;
  children: ReactNode;
}) {
  return condition ? cloneElement(wrapper(children)) : children;
}
