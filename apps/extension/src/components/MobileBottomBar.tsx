import { cn } from "@echotab/ui/util";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export default function MobileBottomBar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mobile-bottom-bar fixed right-0 bottom-0 left-0 mx-auto h-[100px] w-full max-w-[calc(56rem-2px)]",
        className,
      )}>
      <div className="absolute inset-0 z-0 mask-[linear-gradient(0deg,black_35%,transparent_70%)] backdrop-blur-md transition-opacity duration-500 only:opacity-0" />
      {children}
    </div>
  );
}

export function MobileBottomBarPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const target = document.querySelector(".mobile-bottom-bar");
  if (!target) {
    return null;
  }
  return ReactDOM.createPortal(children, target);
}
