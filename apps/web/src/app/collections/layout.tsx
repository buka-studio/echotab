import Link from "next/link";
import { ReactNode } from "react";

import HeaderCTA from "./HeaderCTA";
import PulseLogo from "./PulseLogo";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className="layout flex h-full min-h-screen flex-col bg-background-base font-sans overflow-x-clip"
      vaul-drawer-wrapper="true">
      <main className="flex flex-1 flex-col gap-5 px-5 pb-[100px] max-w-3xl w-full mx-auto border-l border-r border-border">
        <header className="mx-auto flex w-full justify-between gap-2 outlined-bottom py-4">
          <div className="flex items-center gap-2">
            <PulseLogo />
            <Link
              href="/"
              className="text-foreground focus-ring rounded-full py-1">
              EchoTab
            </Link>
          </div>

          <div className="hidden md:block">
            <HeaderCTA />
          </div>
        </header>
        <div className="mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
