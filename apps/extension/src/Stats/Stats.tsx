import { Tabs, TabsContent, TabsList, TabsTrigger } from "@echotab/ui/Tabs";

import useDimensions from "../hooks/useDimensions";
import TagChip from "../TagChip";
import { unassignedTag, useTagStore } from "../TagStore";
import TagRelationshipGraph from "./TagRelationshipGraph";
import TagUsageGraph from "./TagUsageGraph";

enum StatTab {
    Relationships = "Relationships",
    Usage = "Usage",
}

export default function Stats() {
    const tagStore = useTagStore();
    const { measureRef, dimensions } = useDimensions();

    return (
        <div ref={measureRef} className="flex flex-col gap-5">
            <Tabs defaultValue={StatTab.Usage} className="flex-1">
                <TabsList>
                    <TabsTrigger value={StatTab.Usage}>Usage</TabsTrigger>
                    <TabsTrigger value={StatTab.Relationships}>Relationships</TabsTrigger>
                </TabsList>
                <TabsContent value={StatTab.Usage}>
                    <TagUsageGraph height={500} width={dimensions.width!} />
                </TabsContent>
                <TabsContent value={StatTab.Relationships}>
                    <TagRelationshipGraph centerSize={20} height={500} width={dimensions.width!} />
                </TabsContent>
            </Tabs>
            <div className="flex flex-row flex-wrap items-start gap-2 pt-5">
                {Array.from(tagStore.tags.values())
                    .filter((t) => t.id !== unassignedTag.id)
                    .map((t) => (
                        <TagChip key={t.id} color={t.color}>
                            {t.name}
                        </TagChip>
                    ))}
            </div>
        </div>
    );
}
