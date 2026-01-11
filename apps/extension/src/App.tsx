"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import { toast, Toaster } from "@echotab/ui/Toast";
import { TooltipProvider } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { BrowserIcon } from "@phosphor-icons/react";
import { BookmarkFilledIcon, BookmarkIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

import ActiveTabs from "./ActiveTabs";
import Bookmarks from "./Bookmarks";
import ScrollTopFAB from "./components/ScrollTopFAB";
import { DynamicViewportVarsSetter, updateViewport } from "./hooks/useDynamicViewportVars";
import Layout from "./Layout";
import { Panel } from "./models";

import "@echotab/ui/globals.css";
import "./app.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComponentProps, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import AppError from "./AppError";
import ColorTweakpane from "./ColorTweakpane";
import MobileBottomBar from "./components/MobileBottomBar";
import NavMenu from "./NavMenu";
import Onboarding from "./Onboarding";
import PulseLogo from "./PulseLogo";
import { init, useStoresInitialized } from "./store";
import { useCurateReminder } from "./store/curateStore";
import { settingStoreActions, subscribeSettingStore, useSettingStore } from "./store/settingStore";
import { createLogger } from "./util/Logger";

const logger = createLogger("App");

async function initStores() {
  try {
    await Promise.all([init.initUIStore(), init.initTagStore()]);
    await Promise.all([init.initBookmarkStore(), init.initTabStore()]);
    await Promise.all([init.initCurateStore(), init.initRecentlyClosedStore()]);
  } catch (e) {
    logger.error("Failed to initialize application", e);
    toast.error("Failed to initialize application. Please reload the page.");
  }
}

updateViewport();
initStores();
subscribeSettingStore();

function Highlight() {
  return (
    <motion.span
      layoutId="highlight"
      className="bg-surface-3 absolute -inset-px rounded-full border will-change-transform dark:shadow-sm"
      transition={{
        type: "spring",
        bounce: 0.2,
        duration: 0.5,
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
        "focus-ring text-muted-foreground data-[state=active]:text-foreground relative rounded-full border-none p-2 px-8 transition-colors duration-200 data-[state=active]:bg-transparent! data-[state=active]:outline-none dark:data-[state=active]:shadow-none",
      )}
      {...props}
    />
  );
}

const queryClient = new QueryClient();

const handleAppReset = () => window.location.reload();

const handleAppError = (error: Error, info: { componentStack?: string | null }) => {
  logger.error("App error", error, info);
};

export default function App() {
  const activePanel = useSettingStore((s) => s.activePanel);
  const theme = useSettingStore((s) => s.settings.theme);

  const storesInitialized = useStoresInitialized();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePanel]);

  useCurateReminder();

  if (!storesInitialized) {
    return null;
  }

  return (
    <ErrorBoundary fallbackRender={AppError} onReset={handleAppReset} onError={handleAppError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Layout>
            <Tabs value={activePanel} className="flex w-full flex-1 flex-col gap-0">
              <div className="contained outlined-side flex items-center justify-between gap-2 p-3 pt-5 pb-10">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <PulseLogo />
                  EchoTab
                </div>
                <div className="flex items-center gap-2">
                  <TabsList className="flex h-auto gap-2 rounded-full border bg-transparent p-0 dark:shadow-sm">
                    <div className="bg-surface-2 flex rounded-full">
                      <PanelTrigger
                        value={Panel.Tabs}
                        onClick={() => settingStoreActions.activatePanel(Panel.Tabs)}>
                        {activePanel === Panel.Tabs && <Highlight />}
                        <span className="relative z-1 flex items-center gap-1">
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
                        onClick={() => settingStoreActions.activatePanel(Panel.Bookmarks)}>
                        {activePanel === Panel.Bookmarks && <Highlight />}
                        <span className="relative z-1 flex items-center gap-1">
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
                </div>
                <div className="flex items-center gap-2">
                  <NavMenu />
                </div>
              </div>
              <TabsContent value={Panel.Tabs} className="flex flex-1 flex-col focus-visible:ring-0">
                <ActiveTabs />
              </TabsContent>
              <TabsContent
                value={Panel.Bookmarks}
                className="flex flex-1 flex-col focus-visible:ring-0">
                <Bookmarks />
              </TabsContent>
            </Tabs>
            <Onboarding />
            <Toaster theme={theme} />
            <DynamicViewportVarsSetter />
            <MobileBottomBar className="z-50">
              <ScrollTopFAB className="absolute right-10 bottom-4" />
            </MobileBottomBar>
            {/* {import.meta.env.DEV && <ColorTweakpane />} */}
            <ColorTweakpane />
          </Layout>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
