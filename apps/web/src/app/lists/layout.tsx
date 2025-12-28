import Link from "next/link";
import { ReactNode } from "react";

import HeaderCTA from "./HeaderCTA";
import PulseLogo from "./PulseLogo";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className="layout flex h-full min-h-screen flex-col bg-(--background-base) font-sans"
      vaul-drawer-wrapper="true">
      <main className="flex flex-1 flex-col gap-10 px-5 py-4 pb-[100px]">
        <header className="mx-auto flex w-full max-w-3xl justify-between gap-2">
          <div className="flex items-center gap-2">
            <PulseLogo />
            <Link
              href="/"
              className="bg-card border-border text-foreground focus-ring rounded-full border px-5 py-1">
              EchoTab
            </Link>
          </div>

          <div className="hidden md:block">
            <HeaderCTA />
          </div>
        </header>
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
