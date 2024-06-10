import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";
import Toaster, { toast } from "@echotab/ui/Toast";
import { TooltipProvider } from "@echotab/ui/Tooltip";
import { cn } from "@echotab/ui/util";
import { BookmarkIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

import ActiveTabs, { ActiveStore, useActiveTabStore } from "./ActiveTabs";
import { DynamicViewportVarsSetter, updateViewport } from "./hooks/useDynamicViewportVars";
import Layout from "./Layout";
import { Panel } from "./models";
import SavedTabs, { SavedStore } from "./SavedTabs";
import ScrollTopFAB from "./ScrollTopFAB";
import { useTagStore } from "./TagStore";
import UIStore, { useUIStore } from "./UIStore";

import "@echotab/ui/globals.css";
import "./app.css";

import ColorTweakpane from "./ColorTweakpane";
import MobileBottomBar from "./MobileBottomBar";
import PulseLogo from "./PulseLogo";
import SettingsMenu from "./SettingsMenu";
import TagStore from "./TagStore";
import BoxIcon from "./ui/icons/Box";

async function initStores() {
    try {
        await Promise.all([UIStore.initStore(), TagStore.initStore()]);
        await Promise.all([SavedStore.initStore(), ActiveStore.initStore()]);
    } catch (e) {
        console.error(e);
        toast.error("Failed to initialize application. Please reload the extension.");
    }
}

updateViewport();
initStores();

const panels = {
    [Panel.Tabs]: {
        icon: <BoxIcon className="h-4 w-4" />,
    },
    [Panel.Saves]: {
        icon: <BookmarkIcon className="h-4 w-4" />,
    },
};

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

export default function App() {
    const { activePanel, initialized: UIInitialized } = useUIStore();
    const { initialized: tagInitialized } = useTagStore();
    const { initialized: activeInitialized } = useActiveTabStore();

    if (!(UIInitialized && tagInitialized && activeInitialized)) {
        return null;
    }

    return (
        <TooltipProvider>
            <Layout>
                <Tabs value={activePanel} className="mx-auto flex w-full flex-col px-6">
                    <div className="mx-auto mb-10 flex w-full max-w-4xl items-center justify-between gap-2">
                        <div className="border-border flex gap-2 rounded-lg p-1">
                            <TabsList className="flex h-auto gap-2 rounded-full bg-transparent p-0">
                                <PulseLogo />
                                <div className="bg-surface-2 flex rounded-full">
                                    {Object.entries(panels).map(([panel, data]) => (
                                        <TabsTrigger
                                            key={panel}
                                            value={panel}
                                            onClick={() => UIStore.activatePanel(panel as Panel)}
                                            className={cn(
                                                "focus-ring text-muted-foreground data-[state=active]:text-foreground relative rounded bg-transparent p-2 px-8 transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:outline-none",
                                            )}>
                                            {activePanel === panel && <Highlight />}
                                            <span className="relative z-[1] flex items-center gap-1">
                                                {data.icon}
                                                {panel}
                                            </span>
                                        </TabsTrigger>
                                    ))}
                                </div>
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-2">
                            <SettingsMenu />
                        </div>
                    </div>
                    <TabsContent value={Panel.Tabs} className="flex-1 focus-within:outline-none">
                        <ActiveTabs />
                    </TabsContent>
                    <TabsContent value={Panel.Saves} className="flex-1">
                        <SavedTabs />
                    </TabsContent>
                </Tabs>
                <Toaster />
                <DynamicViewportVarsSetter />
                <MobileBottomBar>
                    <ScrollTopFAB className="absolute bottom-4 right-10" />
                </MobileBottomBar>
                {process.env.NODE_ENV === "development" && <ColorTweakpane />}
            </Layout>
        </TooltipProvider>
    );
}
