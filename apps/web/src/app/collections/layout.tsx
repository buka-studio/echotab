import Link from "next/link";
import { ReactNode } from "react";

import HeaderCTA from "./HeaderCTA";
import PulseLogo from "./PulseLogo";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className="layout bg-background-base flex h-full min-h-screen flex-col overflow-x-clip font-sans"
      vaul-drawer-wrapper="true">
      <main className="border-border mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 border-r border-l px-5 pb-[100px]">
        <header className="outlined-bottom mx-auto flex w-full justify-between gap-2 py-4">
          <div className="flex items-center gap-2">
            <PulseLogo />
            <Link href="/" className="text-foreground focus-ring rounded-full py-1">
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
