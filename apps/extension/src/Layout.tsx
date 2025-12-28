import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="layout flex h-full min-h-screen flex-col overflow-x-clip font-sans">
      <main className="flex flex-1 flex-col px-5">{children}</main>
      {/* <div data-slot="layout-sidebar-portal" className="col-3 h-full" /> */}
    </div>
  );
}
