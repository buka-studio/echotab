import { Badge } from "@echotab/ui/Badge";
import Button from "@echotab/ui/Button";
import { cn } from "@echotab/ui/util";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useLayoutEffect, useRef, useState } from "react";

import TabListPlaceholder, { TabListPlaceholderCopy } from "../TabsListPlaceholder";
import { useUIStore } from "../UIStore";
import { useSavedTabStore } from "./SavedStore";
import SavedTabItem from "./SavedTabItem";

const dynamicColCountFromGrid = (row: Element) => {
    const colCount = window
        .getComputedStyle(row)
        .getPropertyValue("grid-template-columns")
        .split(" ").length;

    return colCount;
};

const dynamicRowCountFromGrid = (row: Element) => {
    const rowCount = window
        .getComputedStyle(row)
        .getPropertyValue("grid-template-rows")
        .split(" ").length;

    return rowCount;
};

const defaultEdgeElements = {
    topLeft: 0,
    topRight: 0,
    bottomRight: 0,
    bottomLeft: 0,
};

// src https://github.com/yoksel/url-encoder
const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
function encodeSVG(svg: string) {
    // Use single quotes instead of double to avoid encoding.

    svg = svg.replace(/>\s{1,}</g, `><`);
    svg = svg.replace(/\s{2,}/g, ` `);

    // Using encodeURIComponent() as replacement function
    // allows to keep result code readable
    return svg.replace(symbols, encodeURIComponent);
}

function getEdgeElements(grid?: Element) {
    if (!grid) {
        return defaultEdgeElements;
    }
    const edgeElements = grid.children;
    return {
        topLeft: 0,
        topRight: dynamicColCountFromGrid(grid) - 1,
        bottomRight: edgeElements.length - 1,
        bottomLeft: edgeElements.length - dynamicColCountFromGrid(grid),
    };
}

function PlaceholderItem({ className = "" }) {
    useUIStore();

    const linesPatternBg =
        "data:image/svg+xml," +
        encodeSVG(`<svg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'>
            <g fill='hsl(${window.getComputedStyle(document.documentElement).getPropertyValue("--border")})' fill-opacity='0.4' fill-rule='evenodd'>
                <path d='M5 0h1L0 6V5zM6 5v1H5z' />
            </g>
        </svg>`);

    return (
        <div
            style={{ backgroundImage: `url("${linesPatternBg}")` }}
            className={cn(
                "bg-surface-1 flex items-center justify-center border border-dashed",
                className,
            )}
        />
    );
}

export default function SavedTabs() {
    const tabStore = useSavedTabStore();

    const [pinnedExpanded, setPinnedExpanded] = useState(true);
    const gridRef = useRef<HTMLDivElement>();
    const [placeholderCount, setPlaceholderCount] = useState(0);

    const [edgeIndices, setEdgeIndices] = useState(defaultEdgeElements);

    useLayoutEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                const cols = dynamicColCountFromGrid(entry.target);
                const lastRowItems = tabStore.pinnedTabs.length % cols;
                setPlaceholderCount(
                    lastRowItems === 0
                        ? 0
                        : tabStore.pinnedTabs.length
                          ? cols - lastRowItems
                          : cols,
                );

                setEdgeIndices(getEdgeElements(entry.target));
            }
        });
        if (gridRef.current) {
            observer.observe(gridRef.current);
        }
    }, [pinnedExpanded]);

    return (
        <div>
            <div className="mx-auto max-w-4xl">
                <div className="mb-2 flex select-none items-center text-sm">
                    <span className="mr-2 inline-flex gap-2">
                        <span className="text-muted-foreground">Pinned Tabs</span>
                        <Badge variant="card">{tabStore.pinnedTabs?.length}</Badge>
                    </span>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setPinnedExpanded(!pinnedExpanded);
                        }}>
                        {pinnedExpanded ? "Collapse" : "Expand"}
                        <CaretSortIcon className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                {pinnedExpanded && (
                    <>
                        {tabStore.pinnedTabs.length === 0 && (
                            <TabListPlaceholder
                                layout="grid"
                                count={5}
                                className="[&_.tabs-placeholder]:max-h-[110px]">
                                <TabListPlaceholderCopy
                                    title="No pinned tabs yet."
                                    subtitle="Pin a tab by clicking the pin icon."
                                />
                            </TabListPlaceholder>
                        )}
                        <div
                            className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] [&>*]:ml-[-1px] [&>*]:mt-[-1px]"
                            ref={(e) => {
                                if (!e) {
                                    return;
                                }
                                gridRef.current = e;
                                const cols = dynamicColCountFromGrid(e);
                                const lastRowItems = tabStore.pinnedTabs.length % cols;
                                setPlaceholderCount(
                                    lastRowItems === 0
                                        ? 0
                                        : tabStore.pinnedTabs.length
                                          ? cols - lastRowItems
                                          : cols,
                                );
                            }}>
                            {tabStore.pinnedTabs.map((tab, i) => (
                                <div className="@container relative hover:z-[1]" key={tab.id}>
                                    <SavedTabItem
                                        tab={tab}
                                        className={cn({
                                            "rounded-tr-lg": i === edgeIndices.topRight,
                                            "rounded-tl-lg": i === edgeIndices.topLeft,
                                            "rounded-br-lg": i === edgeIndices.bottomRight,
                                            "rounded-bl-lg": i === edgeIndices.bottomLeft,
                                        })}
                                    />
                                </div>
                            ))}
                            {Array.from({ length: placeholderCount }).map((_, i) => {
                                const totalIndex = tabStore.pinnedTabs.length + i;
                                return (
                                    <PlaceholderItem
                                        className={cn({
                                            "rounded-tr-lg": totalIndex === edgeIndices.topRight,
                                            "rounded-tl-lg": totalIndex === edgeIndices.topLeft,
                                            "rounded-br-lg": totalIndex === edgeIndices.bottomRight,
                                            "rounded-bl-lg": totalIndex === edgeIndices.bottomLeft,
                                        })}
                                        key={i}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
