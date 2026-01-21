"use client"

import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { cn } from "./util"

function Collapsible({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
    return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
    className,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
    return (
        <CollapsiblePrimitive.CollapsibleTrigger
            data-slot="collapsible-trigger"
            className={cn("focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md", className)}
            {...props}
        />
    )
}

function CollapsibleContent({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
    return (
        <CollapsiblePrimitive.CollapsibleContent
            data-slot="collapsible-content"
            {...props}
        />
    )
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }

