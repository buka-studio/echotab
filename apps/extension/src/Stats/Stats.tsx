import { useDimensionsRef } from "@echotab/ui/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";

import { unassignedTag, useTagStore } from "~/store/tagStore";

import TagChip from "../components/tag/TagChip";
import CurateStats from "./CurateStats";
import TagRelationshipGraph from "./TagRelationshipGraph";
import TagUsageGraph from "./TagUsageGraph";

enum StatTab {
  Relationships = "Relationships",
  Usage = "Usage",
  Curate = "Curate",
}

export default function Stats() {
  const tags = useTagStore((s) => s.tags);
  const { observerRef, dimensions } = useDimensionsRef();

  const showTags = false;
  return (
    <div ref={observerRef} className="flex flex-col gap-5 overflow-hidden">
      <Tabs defaultValue={StatTab.Usage} className="flex-1">
        <TabsList>
          <TabsTrigger value={StatTab.Usage}>Tag Count</TabsTrigger>
          <TabsTrigger value={StatTab.Relationships}>Tag Pairs</TabsTrigger>
          <TabsTrigger value={StatTab.Curate}>Curate Stats</TabsTrigger>
        </TabsList>
        <TabsContent value={StatTab.Usage} className="focus-visible:ring-0">
          <TagUsageGraph height={500} width={dimensions.width!} />
        </TabsContent>
        <TabsContent value={StatTab.Relationships} className="focus-visible:ring-0">
          <TagRelationshipGraph centerSize={20} height={500} width={dimensions.width!} />
        </TabsContent>
        <TabsContent value={StatTab.Curate} className="focus-visible:ring-0">
          <CurateStats className="h-[500px] w-full" />
        </TabsContent>
      </Tabs>
      {showTags && (
        <div className="scrollbar-gray flex max-h-[200px] flex-row flex-wrap items-start gap-2 overflow-auto pt-5">
          {tags
            .filter((t) => t.id !== unassignedTag.id)
            .map((t) => (
              <TagChip key={t.id} color={t.color}>
                {t.name}
              </TagChip>
            ))}
        </div>
      )}
    </div>
  );
}
