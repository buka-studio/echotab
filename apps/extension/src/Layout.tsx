import { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function Layout({ children }: Props) {
    return (
        <div className="layout flex h-full min-h-screen flex-col font-sans">
            <main className="flex flex-1 flex-col py-4 pb-[100px] [&>*]:flex-1">{children}</main>
        </div>
    );
}
