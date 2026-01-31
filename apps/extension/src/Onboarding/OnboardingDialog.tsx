import { Button } from "@echotab/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@echotab/ui/Dialog";
import { Toggle } from "@echotab/ui/Toggle";
import { cn } from "@echotab/ui/util";
import {
  ArrowsLeftRightIcon,
  BookBookmarkIcon,
  BroomIcon,
  MagnifyingGlassIcon,
  ShareNetworkIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { LightningBoltIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { ReactNode, Ref, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import TagChip from "../components/tag/TagChip";
import { settingStoreActions, useSettingStore } from "../store/settingStore";
import { tagStoreActions } from "../store/tagStore";
import { toggle } from "../util/set";
import { tagSuggestions } from "./constants";

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.15 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 20 : -20,
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.15 },
    },
  }),
};

const featureContainerVariants: Variants = {
  enter: {},
  center: {
    transition: {
      staggerChildren: 0,
    },
  },
  exit: {},
};

const featureItemVariants: Variants = {
  enter: {
    opacity: 0,
    filter: "blur(4px)",
    scale: 0.95,
  },
  center: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
  },
  exit: {
    opacity: 0,
    filter: "blur(4px)",
    scale: 0.95,
  },
};

function FeatureItem({
  icon,
  title,
  description,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("bg-surface-3 flex flex-col items-start gap-3 rounded-lg p-4", className)}
      variants={featureItemVariants}>
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="text-foreground text-sm font-medium">{title}</div>
      </div>
      <div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
    </motion.div>
  );
}

function StepIndicator({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn("h-1.5 w-1.5 rounded-full transition-colors", {
            "bg-foreground": i === current,
            "bg-muted-foreground/30": i !== current,
          })}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div className="flex flex-col gap-4" ref={ref}>
      <motion.div
        className="flex flex-col gap-4 py-2 *:flex-1 sm:flex-row"
        variants={featureContainerVariants}
        initial="enter"
        animate="center"
        exit="exit">
        <FeatureItem
          icon={<TagIcon className="size-5" />}
          title="Save & Tag"
          description="Save tabs as bookmarks with custom tags."
        />
        <FeatureItem
          icon={<BroomIcon className="size-5" />}
          title="Curate"
          description="Swipe through old bookmarks to clean up."
        />
        <FeatureItem
          icon={<ShareNetworkIcon className="size-5" />}
          title="Share"
          description="Create collections and share them with anyone."
        />
      </motion.div>
    </div>
  );
}

function OrganizeStep({
  selectedTagIndices,
  onToggleTag,
  ref,
}: {
  selectedTagIndices: Set<number>;
  onToggleTag: (i: number) => void;
  ref: Ref<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col gap-4" ref={ref}>
      <motion.div
        className="flex flex-col gap-4 py-2 *:flex-1 sm:flex-row"
        variants={featureContainerVariants}
        initial="enter"
        animate="center"
        exit="exit">
        <FeatureItem
          icon={<LightningBoltIcon className="size-5" />}
          title="Quick Tags"
          description="Use quick tags for fast organization."
        />
        <FeatureItem
          icon={<ArrowsLeftRightIcon className="size-5" />}
          title="Swipe to Curate"
          description="Keep or delete old links with a swipe."
        />
        <FeatureItem
          icon={<MagnifyingGlassIcon className="size-5" />}
          title="Find Anything"
          description="Filter by tags, search by title or URL."
        />
      </motion.div>
      <div>
        <p className="text-muted-foreground mb-3 text-sm">
          Pick some tags to get started. You can always add more later.
        </p>
        <div className="scrollbar-gray scroll-fade flex max-h-[140px] flex-wrap gap-2 overflow-auto">
          {tagSuggestions.map(({ name, color }, i) => (
            <Toggle
              key={name}
              asChild
              pressed={selectedTagIndices.has(i)}
              className="h-auto rounded-full p-0 px-0"
              onPressedChange={() => onToggleTag(i)}>
              <button>
                <TagChip
                  className={cn({
                    "border-dashed bg-transparent": !selectedTagIndices.has(i),
                  })}
                  color={color}
                  indicatorClassName={cn({
                    "opacity-100": selectedTagIndices.has(i),
                    "opacity-60": !selectedTagIndices.has(i),
                  })}>
                  {name}
                </TagChip>
              </button>
            </Toggle>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShareStep({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div className="flex flex-col gap-4" ref={ref}>
      <motion.div
        className="flex flex-col gap-4 py-2 *:flex-1 sm:flex-row"
        variants={featureContainerVariants}
        initial="enter"
        animate="center"
        exit="exit">
        <FeatureItem
          icon={<BookBookmarkIcon className="size-5" />}
          title="Collections"
          description="Bundle related bookmarks into shareable collections."
        />
        <FeatureItem
          icon={<ShareNetworkIcon className="size-5" />}
          title="Publish"
          description="Make any collection public with a single click."
        />
      </motion.div>
      <p className="text-muted-foreground text-sm">
        You're all set! Start saving tabs and organizing your bookmarks.
      </p>
    </div>
  );
}

const steps = [
  {
    title: "Welcome to Echotab",
    description: "A simple but powerful way to manage your tabs.",
  },
  {
    title: "Save, Tag, Curate",
    description: "Keep your browser clutter-free.",
  },
  {
    title: "Create & Share",
    description: "Group bookmarks and publish them to the world.",
  },
];

export default function OnboardingDialog() {
  const { showOnboarding } = useSettingStore((s) => s.settings);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedTagIndices, setSelectedTagIndices] = useState(new Set<number>());

  const [height, setHeight] = useState<number | null>(null);

  const handleToggleTag = (i: number) => {
    setSelectedTagIndices((indices) => {
      const wip = new Set(indices);
      toggle(wip, i);
      return wip;
    });
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    tagStoreActions.createTags(
      Array.from(selectedTagIndices)
        .map((i) => tagSuggestions[i]!)
        .filter(Boolean),
    );
    settingStoreActions.updateSettings({ showOnboarding: false });
  };

  const handleSkip = () => {
    settingStoreActions.updateSettings({ showOnboarding: false });
  };

  if (!showOnboarding) {
    return null;
  }

  const updateHeight = (height?: number | null) => {
    if (!height) return;
    setHeight(height);
  };

  const isLastStep = step === steps.length - 1;
  const currentStep = steps[step]!;

  useHotkeys("right", handleNext);
  useHotkeys("left", handleBack);
  useHotkeys("enter", handleFinish);
  useHotkeys("escape", handleSkip);

  return (
    <Dialog defaultOpen>
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
        </DialogHeader>

        <motion.div
          className="relative overflow-hidden"
          animate={{ height: height || "auto" }}
          transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}>
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit">
              {step === 0 && <WelcomeStep ref={(e) => updateHeight(e?.clientHeight)} />}
              {step === 1 && (
                <OrganizeStep
                  selectedTagIndices={selectedTagIndices}
                  onToggleTag={handleToggleTag}
                  ref={(e) => updateHeight(e?.clientHeight)}
                />
              )}
              {step === 2 && <ShareStep ref={(e) => updateHeight(e?.clientHeight)} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <DialogFooter className="grid grid-cols-[1fr_auto_1fr] flex-row items-center justify-between">
          <StepIndicator current={step} total={steps.length} className="col-2" />
          <div className="col-3 ml-auto flex gap-1">
            {step === 0 ? (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
            {isLastStep ? (
              <Button onClick={handleFinish}>Get Started</Button>
            ) : (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
