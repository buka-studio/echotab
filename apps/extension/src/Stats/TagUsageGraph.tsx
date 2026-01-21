import { AxisBottom, AxisLeft } from "@visx/axis";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { motion } from "framer-motion";
import { ComponentProps, useMemo, useState } from "react";

import { useBookmarkStore, useFilteredTabsByTagId } from "~/store/bookmarkStore";
import { unassignedTag, useTagsById, useTagStore } from "~/store/tagStore";

import SortButton from "../components/SortButton";
import TagChip from "../components/tag/TagChip";
import { numberComparator, SortDir } from "../util/sort";

const defaultMargin = { top: 40, right: 40, bottom: 40, left: 40 };

export type Props = {
  width: number;
  height: number;
  margin?: typeof defaultMargin;
};

const placeholderTagCounts = [12, 34, 12, 5, 4, 23, 9, 10];

function PlaceholderGraph({
  width,
  height,
  margin = defaultMargin,
  ...props
}: Props & ComponentProps<"svg">) {
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleBand<number>({
    range: [0, xMax],
    round: true,
    domain: Array.from({ length: placeholderTagCounts.length }, (_, i) => i),
    padding: 0.2,
  });

  const yScale = scaleLinear<number>({
    range: [yMax, 0],
    round: true,
    domain: [0, Math.max(...placeholderTagCounts)],
  });

  return (
    <svg width={width} height={height} {...props}>
      <LinearGradient id="placeholder-gradient" from="#fff" to="#000" vertical />

      <Group top={margin.top} left={margin.left}>
        <AxisBottom
          tickClassName="[&_text]:fill-foreground"
          axisLineClassName="stroke-foreground/75"
          scale={xScale}
          top={yMax}
          tickFormat={() => ""}
          hideTicks
        />
        <AxisLeft
          tickClassName="[&_text]:fill-foreground"
          axisLineClassName="stroke-foreground/75"
          scale={yScale}
          tickValues={yScale.ticks().filter((f) => Math.round(f) === f)}
          tickFormat={(t) => String(Math.round(t as number))}
        />
        {placeholderTagCounts.map((t, i) => {
          const barWidth = xScale.bandwidth();

          const barHeight = yMax - yScale(t);

          const barX = xScale(i);
          const barY = yMax - barHeight;

          return (
            <Bar
              rx={4}
              key={i}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill="url(#placeholder-gradient)"
            />
          );
        })}
      </Group>
    </svg>
  );
}

export default function TagUsageGraph({ width, height, margin = defaultMargin }: Props) {
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const [sort, setSort] = useState<SortDir | undefined>(SortDir.Desc);

  const allTags = useTagStore((s) => s.tags);
  const tagsById = useTagsById();
  const filteredTabsByTagId = useFilteredTabsByTagId();
  const tabs = useBookmarkStore((s) => s.tabs);

  const tags = useMemo(() => allTags.filter((t) => t.id !== unassignedTag.id), [allTags]);

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        round: true,
        domain: [0, Math.max(...Object.values(filteredTabsByTagId).map((t) => t.length), 0)],
      }),
    [yMax, filteredTabsByTagId],
  );

  const xScale = useMemo(
    () =>
      scaleBand<number>({
        range: [0, xMax],
        round: true,
        domain: tags
          .map((t) => t.id)
          .sort((t1, t2) =>
            sort
              ? numberComparator(
                  yScale(filteredTabsByTagId[t1]?.length ?? 0),
                  yScale(filteredTabsByTagId[t2]?.length ?? 0),
                  sort,
                )
              : 0,
          ),
        padding: 0.2,
      }),
    [xMax, yScale, tags, sort, filteredTabsByTagId],
  );

  const gradients = useMemo(
    () =>
      tags.map((t) => ({
        from: t.color,
        to: t.color + "80",
        fromOffset: "70%",
        id: `${t.id}`,
      })),
    [tags],
  );

  const [hover, setHover] = useState<{ key: number } | null>(null);
  const tooltip = useTooltip<{ id: number }>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const activeTag = tagsById.get(tooltip?.tooltipData?.id || -1);

  const usedTags = new Set(tabs.flatMap((t) => t.tagIds));

  const noTaggedLinks =
    usedTags.size === 0 || (usedTags.size === 1 && usedTags.has(unassignedTag.id));

  const handleSort = () => {
    if (sort === SortDir.Desc) {
      setSort(undefined);
    }
    if (sort === SortDir.Asc) {
      setSort(SortDir.Desc);
    }
    if (sort === undefined) {
      setSort(SortDir.Asc);
    }
  };

  if (noTaggedLinks) {
    return (
      <div className="relative">
        <div className="absolute top-1/2 left-1/2 z-1 translate-x-[-50%] translate-y-[-50%] space-y-2 text-center">
          <div className="text-lg text-balance">Currently, there are no tagged links.</div>
          <div className="text-foreground/75 text-sm text-balance">
            Begin organizing by tagging tabs, and the tag count will be displayed here.
          </div>
        </div>
        <PlaceholderGraph
          height={height}
          width={width}
          margin={margin}
          className="opacity-10 blur-sm"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <span className="text-muted-foreground absolute top-2 right-2 z-10 flex items-center gap-1">
        <SortButton active={Boolean(sort)} dir={sort!} onClick={handleSort}>
          Sort
        </SortButton>
      </span>
      <svg width={width} height={height} ref={containerRef} className="relative">
        {gradients.map((g) => (
          <LinearGradient {...g} vertical key={g.id} />
        ))}
        <rect width={width} height={height} rx={8} className="fill-background" />
        <Group top={margin.top} left={margin.left}>
          <AxisBottom
            tickClassName="[&_text]:fill-foreground"
            axisLineClassName="stroke-foreground/75"
            scale={xScale}
            top={yMax}
            tickFormat={(id) => (tags.length < 5 ? tagsById.get(id)?.name : "")}
            hideTicks
          />
          <AxisLeft
            tickClassName="[&_text]:fill-foreground"
            axisLineClassName="stroke-foreground/75"
            scale={yScale}
            tickValues={yScale.ticks().filter((f) => Math.round(f) === f)}
            tickFormat={(t) => String(Math.round(t as number))}
          />
          {tags.map((t) => {
            const barWidth = xScale.bandwidth();

            const barHeight = yMax - yScale(filteredTabsByTagId[t.id]?.length ?? 0);

            const barX = xScale(t.id);
            const barY = yMax - barHeight;

            const index = barX ? (barX + barWidth) / width : 0;

            return (
              <motion.rect
                rx={2}
                key={t.id}
                x={barX}
                y={barY}
                initial={{
                  opacity: 0,
                  filter: "blur(10px)",
                }}
                animate={{
                  opacity: 1,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.25,
                }}
                width={barWidth}
                height={barHeight}
                fill={`url(#${t.id})`}
                fillOpacity={hover?.key === t.id ? 1 : 0.5}
                onMouseMove={(e) => {
                  const coords = localPoint((e.target as SVGElement).ownerSVGElement!, e);
                  setHover({ key: t.id });
                  tooltip.showTooltip({
                    tooltipLeft: coords?.x,
                    tooltipTop: coords?.y,
                    tooltipData: {
                      id: t.id,
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
        </Group>
        {tooltip.tooltipOpen && activeTag && (
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
            className="border-border bg-popover text-popover-foreground z-60 rounded-md border px-3 py-2 text-sm shadow-md">
            <div className="flex items-center gap-2 p-1 text-sm">
              <TagChip color={activeTag.color}>{activeTag.name}</TagChip> -{" "}
              {filteredTabsByTagId[activeTag.id]?.length ?? 0} tabs
            </div>
          </TooltipInPortal>
        )}
      </svg>
    </div>
  );
}
