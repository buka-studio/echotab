import { useToggle } from "@echotab/ui/hooks";
import { Chord, Ribbon } from "@visx/chord";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { Arc } from "@visx/shape";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { motion } from "framer-motion";
import { ComponentProps, useMemo, useState } from "react";

import { useBookmarkStore } from "~/store/bookmarkStore";
import { unassignedTag, useTagStore } from "~/store/tagStore";

import TagChip from "../components/tag/TagChip";
import { SavedTab, Tag } from "../models";
import { pluralize } from "../util";

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

function calcTabMatrix(tabs: SavedTab[], tags: Tag[], options: { countLoops?: boolean } = {}) {
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
      if (options.countLoops) {
        matrix[tagsToIndices[tag]][tagsToIndices[tag]] += 1;
      }
      for (const o of other) {
        matrix[tagsToIndices[tag]][tagsToIndices[o]] += 1;
      }
    }
  }

  return matrix;
}

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
  const innerRadius = outerRadius - centerSize + 10;

  const bookmarkStore = useBookmarkStore();
  const allTags = useTagStore((s) => s.tags);
  const tags = useMemo(() => allTags.filter((t) => t.id !== unassignedTag.id), [allTags]);
  const [showLoops, toggleShowLoops] = useToggle();

  const [hover, setHover] = useState<{ key: string } | null>(null);
  const tooltip = useTooltip<{ from: number; to: number }>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const { tabMatrix, tagsByIndex } = useMemo(() => {
    const tabMatrix = calcTabMatrix(bookmarkStore.tabs, tags, {
      countLoops: showLoops,
    });
    const tagsByIndex = Object.fromEntries(tags.map((t, i) => [i, t]));

    return {
      tabMatrix,
      tagsByIndex,
    };
  }, [bookmarkStore.tabs, tags, showLoops]);

  const noRelationships = tabMatrix.flat().every((n) => n === 0);

  const tabCount = tooltip.tooltipOpen
    ? (tabMatrix[tooltip.tooltipData!.from]?.[tooltip.tooltipData!.to] ?? 0)
    : 0;

  if (noRelationships) {
    return (
      <div className="relative">
        <div className="absolute top-1/2 left-1/2 z-1 translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
          <div className="text-lg text-balance">
            Currently, there are no links with multiple tags.
          </div>
          <div className="text-foreground/75 text-sm text-balance">
            Add multiple tags to see tag relationships here.
          </div>
        </div>
        <PlaceholderGraph
          height={height}
          width={width}
          centerSize={centerSize}
          className="opacity-10 blur-sm"
        />
      </div>
    );
  }

  return (
    <motion.svg
      width={width}
      height={height}
      ref={containerRef}
      className="relative"
      initial={{
        opacity: 0,
        filter: "blur(10px)",
      }}
      animate={{
        opacity: 1,
        filter: "blur(0px)",
      }}>
      <Group top={height / 2} left={width / 2}>
        <Chord matrix={tabMatrix} padAngle={0.001}>
          {({ chords }) => (
            <g>
              <defs>
                {chords.map((chord, i) => {
                  const sourceColor = tagsByIndex[chord.source.index]?.color;
                  const targetColor = tagsByIndex[chord.target.index]?.color;
                  const gradientId = `ribbon-gradient-${i}`;
                  const sourceAngle = (chord.source.startAngle + chord.source.endAngle) / 2;
                  const targetAngle = (chord.target.startAngle + chord.target.endAngle) / 2;

                  return (
                    <radialGradient
                      key={gradientId}
                      id={gradientId}
                      gradientUnits="userSpaceOnUse"
                      cx={0}
                      cy={0}
                      r={innerRadius}
                      fx={innerRadius * Math.cos(sourceAngle - Math.PI / 2)}
                      fy={innerRadius * Math.sin(sourceAngle - Math.PI / 2)}>
                      <stop offset="0%" stopColor={sourceColor} />
                      <stop offset="100%" stopColor={targetColor} />
                    </radialGradient>
                  );
                })}
              </defs>

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
                    fill={`url(#ribbon-gradient-${i})`}
                    fillOpacity={hover?.key === key ? 1 : 0.5}
                    onMouseMove={(e) => {
                      const coords = localPoint((e.target as SVGElement).ownerSVGElement!, e);
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
              {chords.groups.map((group, i) => {
                return (
                  <Arc
                    key={`arc-${i}`}
                    data-i={i}
                    data={group}
                    innerRadius={innerRadius - 10}
                    outerRadius={outerRadius - 5}
                    fill={`${tagsByIndex[i]?.color}`}
                    rx={4}
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
          className="border-border bg-popover text-popover-foreground z-[60] rounded-md border px-3 py-2 text-sm shadow-md">
          <div>
            <div className="flex items-center gap-2 p-1 text-sm">
              <TagChip color={tagsByIndex[tooltip.tooltipData!.from]?.color}>
                {tagsByIndex[tooltip.tooltipData!.from]?.name}
              </TagChip>{" "}
              +
              <TagChip color={tagsByIndex[tooltip.tooltipData!.to]?.color}>
                {tagsByIndex[tooltip.tooltipData!.to]?.name}
              </TagChip>
            </div>
          </div>

          <div className="mt-2 text-center">{pluralize(tabCount, "tab")}</div>
        </TooltipInPortal>
      )}
    </motion.svg>
  );
}
