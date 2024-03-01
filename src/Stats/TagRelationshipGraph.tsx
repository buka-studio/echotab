import { Chord, Ribbon } from "@visx/chord";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { Arc } from "@visx/shape";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { ComponentProps, useMemo, useState } from "react";

import useToggle from "../hooks/useToggle";
import { SavedTab, Tag } from "../models";
import { useSavedTabStore } from "../SavedTabs";
import TagChip from "../TagChip";
import { unassignedTag, useTagStore } from "../TagStore";

function descending(a: number, b: number): number {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}

function makeMatrix(n: number): number[][] {
    const rows = [] as number[][];
    for (let i = 0; i < n; i++) {
        const cols = Array.from({ length: n }).fill(0) as number[];
        rows.push(cols);
    }

    return rows;
}

function calcTabMatrix(tabs: SavedTab[], tags: Tag[], countLoops?: boolean) {
    const matrix = makeMatrix(tags.length);
    if (!(tags.length && tabs.length)) {
        return matrix;
    }
    const tagsToIndices = Object.fromEntries(tags.map((t, i) => [t.id, i]));

    for (const tab of tabs) {
        const tagIds = tab.tagIds.filter((id) => id !== unassignedTag.id);
        for (const tag of tagIds) {
            const other = new Set(tagIds);
            other.delete(tag);
            if (!tagsToIndices[tag]) {
                continue;
            }
            if (countLoops) {
                matrix[tagsToIndices[tag]][tagsToIndices[tag]] += 1;
            }
            for (const o of other) {
                matrix[tagsToIndices[tag]][tagsToIndices[o]] += 1;
            }
        }
    }

    return matrix;
}

interface Gradient {
    from: string;
    to: string;
    id: string;
}

const calcGradients = (
    tabMatrix: number[][],
    tagsByIndex: Record<number, Tag>,
): Record<string, Gradient> => {
    const gradients: Record<string, Gradient> = {};

    for (let i = 0; i < tabMatrix.length; i++) {
        for (let j = 0; j < tabMatrix[i].length; j++) {
            if (!tabMatrix[i][j]) {
                continue;
            }
            const id = `${i}-${j}`;
            gradients[id] = { from: tagsByIndex[i]?.color, to: tagsByIndex[j]?.color, id };
        }
    }

    return gradients;
};

export type Props = {
    width: number;
    height: number;
    centerSize?: number;
};

const placeholderMatrix = [
    [0, 1, 0, 7, 1, 4, 8, 0, 5, 8],
    [1, 0, 2, 1, 1, 4, 1, 1, 4, 7],
    [0, 2, 0, 0, 6, 7, 7, 9, 7, 1],
    [7, 1, 0, 0, 2, 8, 0, 7, 1, 9],
    [1, 1, 6, 2, 0, 3, 3, 3, 0, 8],
    [4, 4, 7, 8, 3, 0, 8, 3, 2, 8],
    [8, 1, 7, 0, 3, 8, 0, 0, 0, 4],
    [0, 1, 9, 7, 3, 3, 0, 0, 7, 0],
    [5, 4, 7, 1, 0, 2, 0, 7, 0, 2],
    [8, 7, 1, 9, 8, 8, 4, 0, 2, 0],
];

function PlaceholderGraph({
    height,
    width,
    centerSize = 20,
    ...props
}: Props & ComponentProps<"svg">) {
    const outerRadius = Math.min(width, height) * 0.5 - (centerSize + 10);
    const innerRadius = outerRadius - centerSize;

    return (
        <svg width={width} height={height} {...props}>
            <LinearGradient id="placeholder-gradient" from="#fff" to="#000" vertical={false} />
            <Group top={height / 2} left={width / 2}>
                <Chord matrix={placeholderMatrix} padAngle={0.05} sortSubgroups={descending}>
                    {({ chords }) => (
                        <g>
                            {chords.groups.map((group, i) => (
                                <Arc
                                    key={`arc-${i}`}
                                    data={group}
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius}
                                    className="fill-foreground"
                                    rx={4}
                                />
                            ))}
                            {chords.map((chord, i) => (
                                <Ribbon
                                    key={`ribbon-${i}`}
                                    chord={chord}
                                    radius={innerRadius}
                                    fill="url(#placeholder-gradient)"
                                />
                            ))}
                        </g>
                    )}
                </Chord>
            </Group>
        </svg>
    );
}

export default function TagRelationshipGraph({ width, height, centerSize = 20 }: Props) {
    const outerRadius = Math.min(width, height) * 0.5 - (centerSize + 10);
    const innerRadius = outerRadius - centerSize;

    const savedStore = useSavedTabStore();
    const tagStore = useTagStore();
    const tags = Array.from(tagStore.tags.values()).filter((t) => t.id !== unassignedTag.id);
    const [showLoops, toggleShowLoops] = useToggle();

    const [hover, setHover] = useState<{ key: string } | null>(null);
    const tooltip = useTooltip<{ from: number; to: number }>();
    const { containerRef, TooltipInPortal } = useTooltipInPortal({
        detectBounds: true,
        scroll: true,
    });

    const { tabMatrix, gradientMap, tagsByIndex, tabCounts } = useMemo(() => {
        const tabMatrix = calcTabMatrix(savedStore.tabs, tags, showLoops);
        const tagsByIndex = Object.fromEntries(tags.map((t, i) => [i, t]));
        const gradientMap = calcGradients(tabMatrix, tagsByIndex);
        const tabCounts = new Map(tags.map((t) => [t.id, { ...t, tabCount: 0 }]));
        for (const tab of savedStore.tabs) {
            for (const tagId of tab.tagIds) {
                if (tabCounts.has(tagId)) {
                    tabCounts.get(tagId)!.tabCount += 1;
                }
            }
        }

        return {
            tabMatrix,
            gradientMap,
            tagsByIndex,
            tabCounts,
        };
    }, [savedStore.tabs, tags, showLoops]);

    const noRelationships = tabMatrix.flat().every((n) => n === 0);

    if (noRelationships) {
        return (
            <div className="relative">
                <div className="absolute left-1/2 top-1/2 z-[1] translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
                    <div className="text-balance text-lg">
                        Currently, there are no tabs with multiple tags.
                    </div>
                    <div className="text-balance text-sm text-foreground/75">
                        Add multiple tags to see tag relationships here.
                    </div>
                </div>
                <PlaceholderGraph
                    height={height}
                    width={width}
                    centerSize={centerSize}
                    className="opacity-10"
                />
            </div>
        );
    }
    return (
        <svg width={width} height={height} ref={containerRef} className="relative">
            {Object.values(gradientMap).map((g) => (
                <LinearGradient {...g} vertical={false} key={g.id} />
            ))}
            <Group top={height / 2} left={width / 2}>
                <Chord matrix={tabMatrix} padAngle={0.05} sortSubgroups={descending}>
                    {({ chords }) => (
                        <g>
                            {chords.groups.map((group, i) => {
                                return (
                                    <Arc
                                        key={`arc-${i}`}
                                        data={group}
                                        innerRadius={innerRadius}
                                        outerRadius={outerRadius}
                                        fill={`${tagsByIndex[i]?.color}`}
                                        rx={4}
                                    />
                                );
                            })}
                            {chords.map((chord, i) => {
                                const key = `ribbon-${i}`;
                                return (
                                    <Ribbon
                                        style={{
                                            transition: "all 0.25s",
                                        }}
                                        key={key}
                                        chord={chord}
                                        radius={innerRadius}
                                        fill={`url(#${chord.target.index}-${chord.source.index})`}
                                        fillOpacity={hover?.key === key ? 1 : 0.5}
                                        onMouseMove={(e) => {
                                            const coords = localPoint(
                                                (e.target as SVGElement).ownerSVGElement!,
                                                e,
                                            );
                                            setHover({ key });
                                            tooltip.showTooltip({
                                                tooltipLeft: coords?.x,
                                                tooltipTop: coords?.y,
                                                tooltipData: {
                                                    from: chord.source.index,
                                                    to: chord.target.index,
                                                },
                                            });
                                        }}
                                        onMouseLeave={() => {
                                            tooltip.hideTooltip();
                                            setHover(null);
                                        }}
                                    />
                                );
                            })}
                        </g>
                    )}
                </Chord>
            </Group>

            {tooltip.tooltipOpen && (
                <TooltipInPortal
                    top={tooltip.tooltipTop}
                    left={tooltip.tooltipLeft}
                    style={{
                        ...defaultStyles,
                        borderRadius: undefined,
                        background: undefined,
                        color: undefined,
                        padding: undefined,
                    }}
                    className="z-[60] rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
                    <div>
                        <div className="flex items-center gap-2 p-1 text-sm">
                            <TagChip color={tagsByIndex[tooltip.tooltipData!.from].color}>
                                {tagsByIndex[tooltip.tooltipData!.from].name}
                            </TagChip>{" "}
                            +
                            <TagChip color={tagsByIndex[tooltip.tooltipData!.to].color}>
                                {tagsByIndex[tooltip.tooltipData!.to].name}
                            </TagChip>
                        </div>
                    </div>

                    <div className="mt-2 text-center">
                        {tabMatrix[tooltip.tooltipData!.from][tooltip.tooltipData!.to]} tabs
                    </div>
                </TooltipInPortal>
            )}
        </svg>
    );
}
