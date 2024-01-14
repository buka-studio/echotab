"use client";

import { toast as SonnerToast, Toaster as SonnerToaster } from "sonner/dist/index";

import { useUIStore } from "../UIStore";

export const toast = SonnerToast;

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
    const uiStore = useUIStore();

    return (
        <SonnerToaster
            theme={uiStore.settings.theme as ToasterProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    );
};

export default Toaster;
