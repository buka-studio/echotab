import { cn } from "@echotab/ui/util";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import contentStyle from "data-text:./content.css";
import uiStyle from "data-text:@echotab/ui/globals.css";
import { AnimatePresence, motion } from "framer-motion";
import { PlasmoGetStyle } from "plasmo";
import { useEffect, useMemo, useState } from "react";

import ActiveStore from "./ActiveTabs/ActiveStore";
import BookmarkStore from "./Bookmarks/BookmarkStore";
import TagStore from "./TagStore";
import UIStore, { useUIStore } from "./UIStore";
import Widget from "./Widget";
import { getWidgetRoot } from "./Widget/util";

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");

  style.textContent = [uiStyle, contentStyle].map((s) => s.replaceAll(":root", ".root")).join("\n");

  return style;
};

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
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      setOpen((o) => !o);
      return true;
    });
  }, []);

  useEffect(() => {
    if (uiStore.initialized) {
      if (uiStore.settings.primaryColor) {
        getWidgetRoot().style.setProperty("--primary", uiStore.settings.primaryColor);
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
        "echotab-root fixed right-5 top-5 w-full max-w-[min(400px,90vw)] [font-family:sans-serif]",
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

export default CustomButton;
