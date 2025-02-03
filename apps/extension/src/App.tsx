import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import Toaster, { toast } from "@echotab/ui/Toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { Broom as BroomIcon, Browser as BrowserIcon } from "@phosphor-icons/react";
import { BookmarkFilledIcon, BookmarkIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

import ActiveTabs, { ActiveStore, useActiveTabStore } from "./ActiveTabs";
import Bookmarks, { BookmarkStore } from "./Bookmarks";
import ScrollTopFAB from "./components/ScrollTopFAB";
import { DynamicViewportVarsSetter, updateViewport } from "./hooks/useDynamicViewportVars";
import Layout from "./Layout";
import { Panel } from "./models";
import { useTagStore } from "./TagStore";
import UIStore, { subscribeUIStore, useUIStore } from "./UIStore";

import "@echotab/ui/globals.css";
import "./app.css";

import Button from "@echotab/ui/Button";
import ButtonWithTooltip from "@echotab/ui/ButtonWithTooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ComponentProps, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import AppError from "./AppError";
import ColorTweakpane from "./ColorTweakpane";
import MobileBottomBar from "./components/MobileBottomBar";
import { NumberNotificationBadge } from "./components/NumberNotificationBadge";
import { Curate, CurateTrigger } from "./Curate";
import CurateStore, { useCurateStore } from "./Curate/CurateStore";
import KeyboardShortcuts from "./KeyboardShortcuts";
import NavMenu from "./NavMenu";
import Onboarding from "./Onboarding";
import PulseLogo from "./PulseLogo";
import TagStore from "./TagStore";
import { getUtcISO } from "./util/date";

async function initStores() {
  try {
    await Promise.all([UIStore.initStore(), TagStore.initStore()]);
    await Promise.all([BookmarkStore.initStore(), ActiveStore.initStore()]);
    await CurateStore.initStore();
  } catch (e) {
    console.error(e);
    toast.error("Failed to initialize application. Please reload the page.");
  }
}

updateViewport();
initStores();
subscribeUIStore();

function Highlight() {
  return (
    <motion.span
      layoutId="highlight"
      className="bg-surface-3 absolute inset-0 rounded-full border shadow-sm will-change-transform"
      transition={{
        type: "spring",
        bounce: 0.2,
        duration: 0.6,
      }}
      style={{
        originY: "0px",
      }}
    />
  );
}

function PanelTrigger({ className, ...props }: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "focus-ring text-muted-foreground data-[state=active]:text-foreground relative rounded bg-transparent p-2 px-8 transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none",
      )}
      {...props}
    />
  );
}

const queryClient = new QueryClient();

const handleAppReset = () => window.location.reload();

const handleAppError = (error: Error, info: { componentStack?: string | null }) => {
  // todo: log to sentry
};

if (process.env.NODE_ENV === "development") {
  (window as any).BookmarkStore = BookmarkStore;
  (window as any).ActiveStore = ActiveStore;
  (window as any).CurateStore = CurateStore;
}

export default function App() {
  const { activePanel, initialized: UIInitialized } = useUIStore();
  const { initialized: tagInitialized } = useTagStore();
  const { initialized: activeInitialized } = useActiveTabStore();
  const curateStore = useCurateStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePanel]);

  useEffect(() => {
    if (!curateStore.initialized) {
      return;
    }

    const lastRemindedAt = dayjs(curateStore.lastRemindedAt);
    const reminderThreshold = curateStore.settings.reminder.value;
    const reminderUnit = curateStore.settings.reminder.unit;

    const reminderDate = lastRemindedAt.add(reminderThreshold, reminderUnit);

    if (reminderDate.isBefore(dayjs())) {
      toast.info("Reminder: Curate your tabs to keep them organized", {
        action: {
          label: "Curate",
          onClick: () => {
            curateStore.setOpen(true);
          },
        },
      });
      curateStore.lastRemindedAt = getUtcISO();
    }
  }, [curateStore.initialized, curateStore.lastRemindedAt]);

  if (!(UIInitialized && tagInitialized && activeInitialized)) {
    return null;
  }

  return (
    <ErrorBoundary fallbackRender={AppError} onReset={handleAppReset} onError={handleAppError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Layout>
            <Tabs value={activePanel} className="mx-auto flex w-full flex-col px-6">
              <div className="mx-auto mb-10 flex w-full max-w-4xl items-center justify-between gap-2">
                <TabsList className="flex h-auto gap-2 rounded-full bg-transparent p-0">
                  <PulseLogo />
                  <div className="bg-surface-2 flex rounded-full">
                    <PanelTrigger
                      value={Panel.Tabs}
                      onClick={() => UIStore.activatePanel(Panel.Tabs)}>
                      {activePanel === Panel.Tabs && <Highlight />}
                      <span className="relative z-[1] flex items-center gap-1">
                        {activePanel === Panel.Tabs ? (
                          <BrowserIcon weight="fill" className="h-4 w-4" />
                        ) : (
                          <BrowserIcon className="h-4 w-4" />
                        )}
                        Tabs
                      </span>
                    </PanelTrigger>
                    <PanelTrigger
                      value={Panel.Bookmarks}
                      onClick={() => UIStore.activatePanel(Panel.Bookmarks)}>
                      {activePanel === Panel.Bookmarks && <Highlight />}
                      <span className="relative z-[1] flex items-center gap-1">
                        {activePanel === Panel.Bookmarks ? (
                          <BookmarkFilledIcon className="h-4 w-4" />
                        ) : (
                          <BookmarkIcon className="h-4 w-4" />
                        )}
                        Bookmarks
                      </span>
                    </PanelTrigger>
                  </div>
                </TabsList>
                <div className="flex items-center gap-2">
                  <NavMenu>
                    <Curate key={String(curateStore.open)}>
                      <NumberNotificationBadge
                        value={curateStore.queue.length}
                        variant="secondary"
                        show={curateStore.queue.length > 0}>
                        <CurateTrigger>
                          <ButtonWithTooltip
                            tooltipText="Curate"
                            variant="outline"
                            size="icon"
                            className="rounded-full">
                            <BroomIcon className="h-4 w-4" />
                          </ButtonWithTooltip>
                        </CurateTrigger>
                      </NumberNotificationBadge>
                    </Curate>
                  </NavMenu>
                </div>
              </div>
              <TabsContent value={Panel.Tabs} className="flex-1 focus-visible:ring-0">
                <ActiveTabs />
              </TabsContent>
              <TabsContent value={Panel.Bookmarks} className="flex-1 focus-visible:ring-0">
                <Bookmarks />
              </TabsContent>
            </Tabs>
            <Onboarding />
            <Toaster />
            <DynamicViewportVarsSetter />
            <MobileBottomBar>
              <ScrollTopFAB className="absolute bottom-4 right-10" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground absolute bottom-4 left-1/2 z-[1] -translate-x-1/2">
                      Shortcuts
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <KeyboardShortcuts className="py-2" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </MobileBottomBar>
            {process.env.NODE_ENV === "development" && <ColorTweakpane />}
          </Layout>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
