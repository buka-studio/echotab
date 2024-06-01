import {
    closestCenter,
    CollisionDetection,
    DndContext,
    DragOverlay,
    getFirstCollision,
    KeyboardSensor,
    MeasuringStrategy,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    TouchSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    AnimateLayoutChanges,
    arrayMove,
    defaultAnimateLayoutChanges,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@echotab/ui/util";
import { Slot } from "@radix-ui/react-slot";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";

import { groupBy } from "../util";
import { coordinateGetter } from "./coordinateGetter";

type Items = Record<number, number[]>;
export type OrderChange = {
    from: {
        containerId: number;
        index: number;
    };
    to: {
        containerId: number;
        index: number;
    };
    id: number;
};

const SortableListContext = createContext<{
    items: Items | null;
    activeId: number | null;
    draggingIds: number[];
}>({
    items: null,
    activeId: null,
    draggingIds: [],
});

function rollupChanges(changes: OrderChange[]): OrderChange[] {
    const rolledUp: OrderChange[] = [];

    const byId = groupBy(
        changes,
        (c) => c.id,
        (c) => c,
    );

    for (const [id, changes] of Object.entries(byId)) {
        if (changes.length === 0) {
            continue;
        }

        if (changes.length === 1) {
            rolledUp.push(changes[0]);
        } else {
            rolledUp.push({
                from: {
                    containerId: changes[0].from.containerId,
                    index: changes[0].from.index,
                },
                to: {
                    containerId: changes[changes.length - 1].to.containerId,
                    index: changes[changes.length - 1].to.index,
                },
                id: Number(id),
            });
        }
    }

    return rolledUp;
}

export default function SortableList({
    items,
    getSelectedIds,
    onItemsChange,
    onActiveIdChange,
    onSortEnd,
    children,
}: {
    items: Items;
    getSelectedIds: () => Set<number>;
    children?: ReactNode;
    onItemsChange: (items: Items, change?: OrderChange) => void;
    onSortEnd: (changes: any) => void;
    onActiveIdChange: (id: number | null) => void;
}) {
    const [activeId, _setActiveId] = useState<number | null>(null);
    const wipChanges = useRef<OrderChange[]>([]);

    const [draggingIds, setDraggingIds] = useState<number[]>([]);

    const setActiveId = (id: number | null) => {
        _setActiveId(id);
        onActiveIdChange(id);
    };

    const lastOverId = useRef<UniqueIdentifier | null>(null);
    const recentlyMovedToNewContainer = useRef(false);

    const collisionDetectionStrategy: CollisionDetection = useCallback(
        (args) => {
            if (activeId && activeId in items) {
                return closestCenter({
                    ...args,
                    droppableContainers: args.droppableContainers.filter(
                        (container) => container.id in items,
                    ),
                });
            }

            // Start by finding any intersecting droppable
            const pointerIntersections = pointerWithin(args);
            const intersections =
                pointerIntersections.length > 0
                    ? // If there are droppables intersecting with the pointer, return those
                      pointerIntersections
                    : rectIntersection(args);
            let overId = getFirstCollision(intersections, "id") as number;

            if (overId != null) {
                if (overId in items) {
                    const containerItems = items[overId];

                    // If a container is matched and it contains items (columns 'A', 'B', 'C')
                    if (containerItems.length > 0) {
                        // Return the closest droppable within that container
                        overId = closestCenter({
                            ...args,
                            droppableContainers: args.droppableContainers.filter(
                                (container) =>
                                    container.id !== overId &&
                                    containerItems.includes(container.id as number),
                            ),
                        })[0]?.id as number;
                    }
                }

                lastOverId.current = overId;

                return [{ id: overId }];
            }

            // When a draggable item moves to a new container, the layout may shift
            // and the `overId` may become `null`. We manually set the cached `lastOverId`
            // to the id of the draggable item that was moved to the new container, otherwise
            // the previous `overId` will be returned which can cause items to incorrectly shift positions
            if (recentlyMovedToNewContainer.current) {
                lastOverId.current = activeId;
            }

            // If no droppable is matched, return the last match
            return lastOverId.current ? [{ id: lastOverId.current }] : [];
        },
        [activeId, items],
    );

    const [clonedItems, setClonedItems] = useState<Items | null>(null);
    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter,
        }),
    );

    const findContainer = (id: UniqueIdentifier) => {
        if (id in items) {
            return id;
        }

        return Object.keys(items).find((key) => items[Number(key)].find((i) => i === id)) as
            | number
            | undefined;
    };

    const onDragCancel = () => {
        if (clonedItems) {
            // Reset items to their original state in case items have been
            // Dragged across containers
            onItemsChange(clonedItems);
        }

        setActiveId(null);
        setDraggingIds([]);
        setClonedItems(null);
        wipChanges.current = [];
    };

    useEffect(() => {
        requestAnimationFrame(() => {
            recentlyMovedToNewContainer.current = false;
        });
    }, [items]);

    function filterItems(items: number[]) {
        if (!activeId) {
            return items;
        }

        return items.filter((id) => id === activeId || !getSelectedIds().has(id));
    }

    const initialContainer = useMemo(() => (activeId ? findContainer(activeId) : null), [activeId]);

    return (
        <SortableListContext.Provider value={{ items, activeId, draggingIds }}>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetectionStrategy}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
                modifiers={[restrictToVerticalAxis]}
                onDragStart={({ active }) => {
                    setDraggingIds(() => {
                        const selectedIds = getSelectedIds();
                        return selectedIds.has(active.id as number)
                            ? Array.from(selectedIds)
                            : [active.id as number];
                    });
                    setActiveId(active.id as number);
                    setClonedItems(items);
                    wipChanges.current = [];
                }}
                onDragOver={({ active, over }) => {
                    const overId = over?.id;

                    if (overId == null || active.id in items) {
                        return;
                    }

                    const overContainer = findContainer(overId) as number;
                    const activeContainer = findContainer(active.id) as number;

                    if (!overContainer || !activeContainer) {
                        return;
                    }

                    if (activeContainer !== overContainer) {
                        const activeItems = items[activeContainer];
                        const overItems = items[overContainer];
                        const overIndex = overItems.indexOf(overId as number);
                        const activeIndex = activeItems.indexOf(active.id as number);

                        let newIndex: number;

                        if (overId in items) {
                            newIndex = overItems.length + 1;
                        } else {
                            const isBelowOverItem =
                                over &&
                                active.rect.current.translated &&
                                active.rect.current.translated.top >
                                    over.rect.top + over.rect.height;

                            const modifier = isBelowOverItem ? 1 : 0;

                            newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
                        }

                        recentlyMovedToNewContainer.current = true;

                        return onItemsChange({
                            ...items,
                            [activeContainer]: items[activeContainer].filter(
                                (item) => item !== active.id,
                            ),
                            [overContainer]: [
                                ...items[overContainer].slice(0, newIndex),
                                items[activeContainer][activeIndex],
                                ...items[overContainer].slice(
                                    newIndex,
                                    items[overContainer].length,
                                ),
                            ],
                        });
                    }
                }}
                onDragEnd={({ active, over }) => {
                    const activeContainer = findContainer(active.id!) as number;

                    if (!activeContainer) {
                        setActiveId(null);
                        setDraggingIds([]);
                        return;
                    }

                    const overId = over?.id;

                    if (overId == null) {
                        setActiveId(null);
                        setDraggingIds([]);
                        return;
                    }

                    const overContainer = findContainer(overId) as number;

                    const selectedIds = getSelectedIds();
                    const ids = selectedIds.size
                        ? [
                              active.id as number,
                              ...Array.from(selectedIds).filter((id) => id !== active.id),
                          ]
                        : [active.id as number];

                    if (overContainer) {
                        const overItems = filterItems(items[overContainer]);
                        const overIndex = overItems.indexOf(overId as number);
                        const activeIndex = overItems.indexOf(active.id as number);
                        const newItems = arrayMove(overItems, activeIndex, overIndex);
                        const newActiveIndex = newItems.indexOf(active.id as number);

                        const wipItems = {
                            ...items,
                            [initialContainer as number]: items[initialContainer as number].filter(
                                (id) => !ids.includes(id),
                            ),
                            [activeContainer]: items[activeContainer].filter(
                                (id) => !ids.includes(id),
                            ),
                            [overContainer]: [
                                ...newItems.slice(0, newActiveIndex + 1),
                                ...ids.filter((id) => id !== active.id),
                                ...newItems.slice(newActiveIndex + 1, newItems.length),
                            ],
                        };
                        onItemsChange(wipItems);
                        onSortEnd(wipItems);
                    }

                    setActiveId(null);
                    setDraggingIds([]);
                }}
                onDragCancel={onDragCancel}>
                {children}
            </DndContext>
        </SortableListContext.Provider>
    );
}

export function SortableOverlayItem({ children }: { children: ReactNode }) {
    const { activeId } = useContext(SortableListContext);

    return createPortal(<DragOverlay>{activeId && children}</DragOverlay>, document.body);
}

interface ItemProps {
    id: number;
    children?: ReactNode;
    useHandle?: boolean;
    disabled?: boolean;
    asChild?: boolean;
}

const draggingOpacity = 0.35;

const HandleContext = createContext({});

export function SortableItem({ id, children, useHandle, disabled, asChild }: ItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, active } =
        useSortable({
            disabled,
            id,
        });

    const { draggingIds } = useContext(SortableListContext);

    const style = useMemo(
        () =>
            ({
                transform: CSS.Transform.toString(transform),
                transition,
                touchAction: "manipulation",
                zIndex: isDragging ? 1 : 0,
                opacity: isDragging ? draggingOpacity : 1,
            }) as const,
        [isDragging, transform],
    );

    const Comp = asChild ? Slot : "div";

    return (
        <HandleContext.Provider value={useHandle ? listeners || {} : {}}>
            <Comp
                className={cn("sortable-item flex w-full", { dragging: isDragging })}
                ref={setNodeRef}
                style={style}
                {...attributes}
                tabIndex={-1}
                {...(!useHandle && listeners)}
                data-is-dragging={isDragging}
                data-is-dragged={draggingIds.includes(id) && !isDragging}>
                {children}
            </Comp>
        </HandleContext.Provider>
    );
}

export function SortableHandle({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
    const listeners = useContext(HandleContext);

    const Comp = asChild ? Slot : "div";

    return (
        <Comp className="sortable-handle" {...listeners}>
            {children}
        </Comp>
    );
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
    defaultAnimateLayoutChanges({ ...args, wasDragging: true });

export function DroppableContainer({
    children,
    disabled,
    id,
    asChild,
    ...props
}: {
    children: any;
    disabled?: boolean;
    id: UniqueIdentifier;
    style?: React.CSSProperties;
    asChild?: boolean;
}) {
    const items = useContext(SortableListContext).items![id as number];

    const { active, attributes, isDragging, over, setNodeRef, transition, transform } = useSortable(
        {
            id,
            data: {
                type: "container",
                children: items,
            },
            animateLayoutChanges,
        },
    );

    const isOverContainer = over
        ? (id === over.id && active?.data.current?.type !== "container") ||
          items.includes(over.id as number)
        : false;

    const Comp = asChild ? Slot : "div";

    return (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <Comp
                data-over={isOverContainer}
                ref={disabled ? undefined : setNodeRef}
                style={{
                    transition,
                    transform: CSS.Translate.toString(transform),
                    opacity: isDragging ? 0.5 : undefined,
                }}
                {...props}>
                {children}
            </Comp>
        </SortableContext>
    );
}
