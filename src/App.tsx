import { BarChartIcon, GearIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

import ActiveTabs from "./ActiveTabs";
import { DynamicViewportVarsSetter, updateViewport } from "./hooks/useDynamicViewportVars";
import Layout from "./Layout";
import { Panel } from "./models";
import SavedTabs from "./SavedTabs";
import ScrollTopFAB from "./ScrollTopFAB";
import SettingsCommand from "./SettingsCommand";
import Stats from "./Stats";
import { useTagStore } from "./TagStore";
import ThemeToggle from "./ThemeToggle";
import Button from "./ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/Dialog";
import Logo from "./ui/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import Toaster from "./ui/Toast";
import { TooltipProvider } from "./ui/Tooltip";
import UIStore, { useUIStore } from "./UIStore";
import { cn } from "./util";

import "./app.css";

import MobileBottomBar from "./MobileBottomBar";

updateViewport();

export default function App() {
    const { activePanel, initialized: UIInitialized } = useUIStore();
    const { initialized: tagInitialized } = useTagStore();
    if (!(UIInitialized && tagInitialized)) {
        return null;
    }

    return (
        <TooltipProvider>
            <Layout>
                <Tabs value={activePanel} className="mx-auto flex w-full flex-col px-6">
                    <div className="mx-auto mb-10 flex w-full max-w-4xl items-center justify-between gap-2">
                        <div className="flex gap-2 rounded-lg border border-border p-1">
                            <TabsList className="flex h-auto gap-2 bg-transparent p-0">
                                <Logo className="mx-1 h-4 w-4 text-primary" />
                                {Object.keys(Panel).map((panel) => (
                                    <TabsTrigger
                                        key={panel}
                                        value={panel}
                                        onClick={() => UIStore.activatePanel(panel as Panel)}
                                        className={cn(
                                            "focus-ring relative rounded bg-transparent p-1 px-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:text-background data-[state=active]:shadow-none data-[state=active]:outline-none",
                                        )}>
                                        {activePanel === panel && (
                                            <motion.span
                                                layoutId="highlight"
                                                className="absolute inset-0 rounded bg-primary will-change-transform"
                                                transition={{
                                                    type: "spring",
                                                    bounce: 0.2,
                                                    duration: 0.6,
                                                }}
                                                style={{
                                                    originY: "0px",
                                                }}
                                            />
                                        )}
                                        <span className="relative z-[1]">{panel}</span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost">
                                        <BarChartIcon className="mr-2 h-4 w-4" />
                                        Stats
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Tag Statistics</DialogTitle>
                                    </DialogHeader>
                                    <Stats />
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost">
                                        <GearIcon className="mr-2 h-4 w-4" />
                                        Settings
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <SettingsCommand />
                                </DialogContent>
                            </Dialog>
                            <ThemeToggle />
                        </div>
                    </div>
                    <TabsContent value={Panel.Active} className="flex-1 focus-within:outline-none">
                        <ActiveTabs />
                    </TabsContent>
                    <TabsContent value={Panel.Saved} className="flex-1">
                        <SavedTabs />
                    </TabsContent>
                </Tabs>
                <Toaster />
                <DynamicViewportVarsSetter />
                <MobileBottomBar>
                    <ScrollTopFAB className="absolute bottom-4 right-10 " />
                </MobileBottomBar>
            </Layout>
        </TooltipProvider>
    );
}
