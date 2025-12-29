import "@echotab/ui/globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import ActiveStore from "../../ActiveTabs/ActiveStore";
import BookmarkStore from "../../Bookmarks/BookmarkStore";
import TagStore from "../../TagStore";
import UIStore from "../../UIStore";
import Widget from "../../Widget";

const queryClient = new QueryClient();

async function initStores() {
  try {
    await Promise.all([UIStore.initStore(), TagStore.initStore()]);
    await Promise.all([BookmarkStore.initStore(), ActiveStore.initStore()]);
  } catch (e) {
    console.error(e);
  }
}

function WidgetApp() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initStores().then(() => {
      setInitialized(true);
    });
  }, []);

  if (!initialized) {
    return null;
  }

  return (
    <Widget
      onClose={() => {
        window.parent.postMessage({ type: "echotab-widget-closed" }, "*");
      }}
    />
  );
}

ReactDOM.createRoot(document.querySelector(".echotab-root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WidgetApp />
    </QueryClientProvider>
  </React.StrictMode>,
);
