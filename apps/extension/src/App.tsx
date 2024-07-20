import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import Toaster, { toast } from "@echotab/ui/Toast";
import { TooltipProvider } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { Browser as BrowserIcon } from "@phosphor-icons/react";
import { BookmarkFilledIcon, BookmarkIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

import ActiveTabs, { ActiveStore, useActiveTabStore } from "./ActiveTabs";
import Bookmarks, { BookmarkStore } from "./Bookmarks";
import ScrollTopFAB from "./components/ScrollTopFAB";
import { DynamicViewportVarsSetter, updateViewport } from "./hooks/useDynamicViewportVars";
import Layout from "./Layout";
import { Panel } from "./models";
import { useTagStore } from "./TagStore";
import UIStore, { useUIStore } from "./UIStore";

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
import TagStore from "./TagStore";

async function initStores() {
  try {
    await Promise.all([UIStore.initStore(), TagStore.initStore()]);
    await Promise.all([BookmarkStore.initStore(), ActiveStore.initStore()]);
  } catch (e) {
    console.error(e);
    toast.error("Failed to initialize application. Please reload the page.");
  }
}

updateViewport();
initStores();

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

export default function App() {
  const { activePanel, initialized: UIInitialized } = useUIStore();
  const { initialized: tagInitialized } = useTagStore();
  const { initialized: activeInitialized } = useActiveTabStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePanel]);

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
                          <BookmarkFilledIcon className="h-4 w-4" />
                        ) : (
                          <BookmarkIcon className="h-4 w-4" />
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
                          <BrowserIcon weight="fill" className="h-4 w-4" />
                        ) : (
                          <BrowserIcon className="h-4 w-4" />
                        )}
                        Bookmarks
                      </span>
                    </PanelTrigger>
                  </div>
                </TabsList>
                <div className="flex items-center gap-2">
                  <NavMenu />
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
            </MobileBottomBar>
            {process.env.NODE_ENV === "development" && <ColorTweakpane />}
          </Layout>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
