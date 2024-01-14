import { ArrowUpIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

import Button from "./ui/Button";
import { cn } from "./util";

export default function ScrollTopFAB({ showTrigger = 300 }: { showTrigger?: number }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const listener = () => {
            setVisible(window.scrollY > showTrigger);
        };

        document.addEventListener("scroll", listener);
        return () => {
            document.removeEventListener("scroll", listener);
        };
    }, [showTrigger]);

    return (
        <Button
            className={cn("fixed bottom-5 right-10 transition-opacity duration-150", {
                "opacity-0": !visible,
            })}
            onClick={() =>
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                })
            }
            size="icon"
            variant="ghost">
            <ArrowUpIcon />
        </Button>
    );
}
