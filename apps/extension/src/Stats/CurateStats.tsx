import { NumberFlow } from "@echotab/ui/NumberFlow";
import { cn } from "@echotab/ui/util";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Session, useCurateStore } from "../Curate/CurateStore";

function Counter({ value, className }: { value: number; className?: string }) {
  return (
    <NumberFlow
      value={value}
      className={cn("text-muted-foreground text-5xl font-bold tabular-nums md:text-7xl", className)}
    />
  );
}

function Counters({
  kept,
  deleted,
  className,
}: {
  kept: number;
  deleted: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-1 items-center justify-center gap-20 px-10 md:px-20",
        className,
      )}>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="ml-auto">
          <Counter
            value={deleted}
            className="ml-auto [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <p className="text-muted-foreground relative -top-3 text-center text-base">Deleted</p>
        </div>
      </div>
      <div className="bg-border absolute left-1/2 h-[100px] w-[1px] -translate-x-1/2" />
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mr-auto">
          <Counter
            value={kept}
            className="mr-auto [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <p className="text-muted-foreground relative -top-3 text-center text-base">Kept</p>
        </div>
      </div>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
  show: (active: boolean) => ({
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    x: active ? -6 : 0,
    transition: {
      duration: 0.2,
    },
  }),
};

export function SessionNavigation({
  className,
  activeSession,
  onSessionClick,
}: {
  className?: string;
  activeSession?: Session;
  onSessionClick: (session?: Session) => void;
}) {
  const curateStore = useCurateStore();

  return (
    <motion.ul
      className={cn(
        "scrollbar-gray flex max-h-full flex-col gap-2 overflow-auto py-1 pl-2",
        className,
      )}
      variants={container}
      initial="hidden"
      animate="show">
      <AnimatePresence mode="popLayout">
        <motion.li
          className={cn("text-foreground/50 mb-5 text-sm leading-4", {
            "text-foreground": !activeSession,
          })}
          variants={item}
          custom={!activeSession}
          layout
          exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}>
          <button
            className="flex w-full items-center gap-1 truncate rounded text-left select-none focus-visible:underline focus-visible:outline-none"
            onClick={() => onSessionClick(undefined)}>
            Total
          </button>
        </motion.li>
        {curateStore.sessions.map((s, i) => {
          const isActive = activeSession?.date === s.date;
          return (
            <motion.li
              variants={item}
              custom={isActive}
              layout
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              key={i}
              className={cn("text-foreground/50 text-sm leading-4", {
                "text-foreground": isActive,
              })}>
              <button
                className="flex w-full items-center gap-1 truncate rounded text-left select-none focus-visible:underline focus-visible:outline-none"
                onClick={() => onSessionClick(s)}>
                {dayjs(s.date).format("D MMM")}
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
}

export default function CuratedStats({ className }: { className?: string }) {
  const curateStore = useCurateStore();
  const [session, setSession] = useState<Session | undefined>(curateStore.sessions[0]);

  const allTime = curateStore.sessions.reduce(
    (acc, session) => {
      acc.kept += session.kept;
      acc.deleted += session.deleted;
      return acc;
    },
    {
      kept: 0,
      deleted: 0,
    },
  );

  const noCurateSessions = curateStore.sessions.length === 0;

  if (noCurateSessions) {
    return (
      <div className={cn("relative flex flex-col items-center justify-center", className)}>
        <div className="absolute top-1/2 left-1/2 z-1 translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
          <div className="text-lg text-balance">Currently, there are no curate sessions.</div>
          <div className="text-foreground/75 text-sm text-balance">
            Begin curating by clicking the Curate button, and your stats will be displayed here.
          </div>
        </div>
        <div className="pointer-events-none flex h-full w-full items-center opacity-50 blur-sm">
          <ul className={cn("flex flex-col gap-2 py-1 pl-2")}>
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i}>
                <button className="flex w-full items-center gap-1 truncate rounded text-left select-none focus-visible:underline focus-visible:outline-none">
                  {dayjs()
                    .subtract(i + 2, "day")
                    .format("D MMM")}
                </button>
              </li>
            ))}
          </ul>
          <Counters kept={162} deleted={74} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-around", className)}>
      <SessionNavigation activeSession={session} onSessionClick={setSession} />
      <Counters
        kept={session?.kept ?? allTime.kept}
        deleted={session?.deleted ?? allTime.deleted}
      />
    </div>
  );
}
