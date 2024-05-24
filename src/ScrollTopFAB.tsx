import { ArrowUpIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import Button from "./ui/Button";

export default function ScrollTopFAB({
    className,
    showTrigger = 300,
}: {
    className?: string;
    showTrigger?: number;
}) {
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
        <AnimatePresence>
            {visible && (
                <Button
                    asChild
                    className={className}
                    onClick={() =>
                        window.scrollTo({
                            top: 0,
                            behavior: "auto",
                        })
                    }
                    aria-label="Scroll to top"
                    size="icon"
                    variant="ghost">
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}>
                        <ArrowUpIcon />
                    </motion.button>
                </Button>
            )}
        </AnimatePresence>
    );
}
