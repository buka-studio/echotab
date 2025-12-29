// content.tsx
// import uiStyle from "@echotab/ui/globals.css?inline";
import { cn } from "@echotab/ui/util";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// 1. Import SnapDOM
import { snapdom } from "@zumer/snapdom";
import { AnimatePresence, motion } from "framer-motion";
// import { PlasmoGetStyle } from "plasmo";
import { useEffect, useMemo, useState } from "react";

import ActiveStore from "../../ActiveTabs/ActiveStore";
import BookmarkStore from "../../Bookmarks/BookmarkStore";
import TagStore from "../../TagStore";
import UIStore, { useUIStore } from "../../UIStore";
import Widget from "../../Widget";
import { getWidgetRoot } from "../../Widget/util";

// import contentStyle from "./content.css?inline";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx) {
    // 2. Made main async to handle setup if needed

    // --- SNAPDOM INTEGRATION START ---
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Listen for snapshot requests
      if (message.type === "REQUEST_SNAPDOM_SNAPSHOT") {
        (async () => {
          try {
            // Capture the page
            const img = await snapdom.toPng(document.body, {
              scale: 1,
              quality: 0.8,
              cache: "soft",
              exclude: [".echotab-root"],
            });

            sendResponse({ success: true, dataUrl: img.src });
          } catch (error: any) {
            console.warn("EchoTab Snapshot failed:", error);
            sendResponse({ success: false, error: error.message });
          }
        })();
        return true;
      }

      return false;
    });

    async function initStores() {
      try {
        await Promise.all([UIStore.initStore(), TagStore.initStore()]);
        await Promise.all([BookmarkStore.initStore(), ActiveStore.initStore()]);
      } catch (e) {
        console.error(e);
      }
    }

    const queryClient = new QueryClient();

    const CustomButton = () => {
      const [open, setOpen] = useState(false);
      const uiStore = useUIStore();

      useEffect(() => {
        initStores();

        // Listener for Opening the Widget
        const messageListener = (message: any, sender: any, sendResponse: any) => {
          if (message.action === "open-popup" || message.type === "open-popup") {
            setOpen((o) => !o);
            // We don't return true here unless we need to send an async response
          }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => {
          chrome.runtime.onMessage.removeListener(messageListener);
        };
      }, []);

      useEffect(() => {
        if (uiStore.initialized) {
          if (uiStore.settings.primaryColor) {
            getWidgetRoot()?.style.setProperty("--primary", uiStore.settings.primaryColor);
          }
        }
      }, [uiStore.initialized, uiStore.settings.theme]);

      const theme = useMemo(() => {
        if (uiStore.settings.theme === "system") {
          return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return uiStore.settings.theme;
      }, [uiStore.settings.theme]);

      return (
        <div
          className={cn(
            "echotab-root fixed top-5 right-5 z-[2147483647] w-full max-w-[min(400px,90vw)] [font-family:sans-serif]",
            // Added high z-index to ensure it sits above page content
            {
              dark: theme === "dark",
            },
          )}>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}>
                <QueryClientProvider client={queryClient}>
                  <Widget onClose={() => setOpen(false)} />
                </QueryClientProvider>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    };

    // Return the component to Plasmo's renderer
    return CustomButton;
  },
});
