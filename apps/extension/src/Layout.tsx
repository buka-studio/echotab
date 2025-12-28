import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="layout grid h-full min-h-screen grid-cols-[1fr_minmax(auto,56rem)_1fr] grid-rows-[auto_auto_auto] gap-x-5 overflow-x-clip font-sans">
      <main className="border-border/50 col-2 flex flex-1 flex-col border-r border-l py-4 pb-[100px] [&>*]:flex-1">
        {children}
      </main>
      <div data-slot="layout-sidebar-portal" className="col-3 h-full" />
    </div>
  );
}
