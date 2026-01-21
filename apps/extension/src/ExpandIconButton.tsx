import { Button } from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { motion, Variants } from "framer-motion";
import { ComponentProps } from "react";

interface Props extends ComponentProps<typeof Button> {
  icon: React.ReactNode;
  children: React.ReactNode;
}

const textVariants: Variants = {
  rest: {
    opacity: 0,
    width: 0,
    x: -10,
    filter: "blur(2px)",
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
  hover: {
    opacity: 1,
    width: "auto",
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

export default function ExpandIconButton({ icon, className, children, ...props }: Props) {
  return (
    <Button {...props} className={cn(className)} asChild>
      <motion.button initial="rest" whileHover="hover" whileFocus="hover">
        {icon}

        <motion.span variants={textVariants} className="overflow-hidden pl-2">
          <span className="text-sm whitespace-nowrap">{children}</span>
        </motion.span>
      </motion.button>
    </Button>
  );
}
