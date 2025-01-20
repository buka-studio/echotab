import { motion } from "framer-motion";
import { CSSProperties, forwardRef, useImperativeHandle, useState } from "react";

const variantsOutline = {
  initial: {
    scale: 1,
  },
  tap: {
    // scale: 0.85,
  },
  clicked: {
    scale: 0,
  },
};

const variantsFill = {
  initial: {
    scale: 0,
  },
  tap: {
    scale: 0,
  },
  clicked: {
    scale: 1.2,
  },
};

const variantsCircle = {
  initial: {
    rotate: 0,
    opacity: 100,
    transition: {
      duration: 0,
    },
  },
  tap: {
    rotate: 180,
    scale: 0.95,
    opacity: 0,
  },
  clicked: {
    // scale: 1.05,
    rotate: 360,
  },
};

const variantsContainer = {
  initial: {
    scale: 1,
  },
  hover: {
    brightness: 1.2,
    // scale: 1.05,
  },
  tap: {
    // scale: 0.95,
  },
};

export type ButtonRef = {
  activate: (variant: string) => void;
};

interface ChoiceButtonProps {
  className?: string;
  onClick?: () => void;
  IconElement: React.ElementType;
  color?: string;
}

const ChoiceButton = forwardRef<ButtonRef, ChoiceButtonProps>(function ChoiceButton(
  { className, onClick, IconElement, color },
  ref,
) {
  const [variant, setVariant] = useState("initial");

  useImperativeHandle(ref, () => ({
    activate: (variant: string) => {
      setVariant("clicked");
      setTimeout(() => {
        setVariant("initial");
      }, 750);
    },
  }));

  return (
    <motion.button
      className="relative flex h-[64px] w-[64px] rounded-full border-2 border-[color-mix(in_srgb,var(--base-color),transparent_50%)] bg-[color-mix(in_srgb,var(--base-color),transparent_80%)] focus-visible:outline-none"
      style={
        {
          "--base-color": color,
        } as CSSProperties
      }
      initial={variant}
      animate={variant}
      variants={variantsContainer}
      whileFocus="hover"
      whileHover="hover"
      onClick={() => {
        setVariant("clicked");
        setTimeout(() => {
          setVariant("initial");
        }, 750);
        onClick?.();
      }}
      whileTap="tap">
      <motion.div
        className="absolute -inset-2 rounded-full bg-[color-mix(in_srgb,var(--base-color),transparent_90%)] blur-sm"
        variants={variantsCircle}
      />
      <motion.div
        className="absolute -inset-2 rounded-full border-2 border-[color-mix(in_srgb,var(--base-color),transparent_30%)] bg-[color-mix(in_srgb,var(--base-color),transparent_80%)] [mask-image:linear-gradient(15deg,transparent_40%,black)]"
        variants={variantsCircle}
      />

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        variants={variantsOutline}>
        <IconElement className="h-8 w-8 text-[var(--base-color)]" />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        variants={variantsFill}>
        <IconElement weight="fill" className="h-8 w-8 text-[var(--base-color)]" />
      </motion.div>
    </motion.button>
  );
});

export default ChoiceButton;
