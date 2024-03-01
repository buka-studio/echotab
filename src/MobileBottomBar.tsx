import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export default function MobileBottomBar({ children }: { children?: React.ReactNode }) {
    return (
        <div className="mobile-bottom-bar fixed bottom-0 left-0 right-0 mx-auto h-[100px] w-full max-w-4xl">
            <div className="absolute inset-0 z-0 bg-background/50 backdrop-blur-md transition-opacity duration-500 [mask-image:linear-gradient(0deg,black_35%,transparent_70%)] only:opacity-0" />
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
