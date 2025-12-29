import "@echotab/ui/globals.css";
import "../../app.css";
import "./content.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { snapdom } from "@zumer/snapdom";
import ReactDOM from "react-dom/client";

import ActiveStore from "../../ActiveTabs/ActiveStore";
import BookmarkStore from "../../Bookmarks/BookmarkStore";
import TagStore from "../../TagStore";
import UIStore from "../../UIStore";
import Widget from "../../Widget";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    let ui: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;
    let isMounted = false;
    let root: ReactDOM.Root | null = null;

    async function initStores() {
      try {
        await Promise.all([UIStore.initStore(), TagStore.initStore()]);
        await Promise.all([BookmarkStore.initStore(), ActiveStore.initStore()]);
      } catch (e) {
        console.error(e);
      }
    }

    const queryClient = new QueryClient();

    ui = await createShadowRootUi(ctx, {
      name: "echotab-widget",
      position: "overlay",
      anchor: "body",
      onMount: async (container) => {
        await initStores();

        container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: min(400px, 90vw);
          z-index: 2147483647;
        `;

        root = ReactDOM.createRoot(container);
        root.render(
          <QueryClientProvider client={queryClient}>
            <Widget
              onClose={() => {
                if (ui && isMounted) {
                  ui.remove();
                  isMounted = false;
                }
              }}
            />
          </QueryClientProvider>,
        );

        isMounted = true;
      },
      onRemove: () => {
        if (root) {
          root.unmount();
          root = null;
        }
        isMounted = false;
      },
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "REQUEST_SNAPDOM_SNAPSHOT") {
        (async () => {
          try {
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

      if (message.action === "open-popup" || message.type === "open-popup") {
        if (ui) {
          if (isMounted) {
            ui.remove();
            isMounted = false;
          } else {
            ui.mount();
          }
        }
        return false;
      }

      return false;
    });
  },
});
