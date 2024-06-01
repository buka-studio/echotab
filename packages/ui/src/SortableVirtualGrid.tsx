import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    UniqueIdentifier,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { FC, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface RenderProps {
    handleProps: Record<string, unknown>;
    isDragging: boolean;
    isActive: boolean;
}

interface ItemProps {
    id: string;
    children(props: RenderProps): JSX.Element;
    useHandle?: boolean;
    disabled?: boolean;
}

const draggingOpacity = 0.35;

const SortableItem: FC<ItemProps> = ({ id, children, useHandle, disabled }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, active } =
        useSortable({
            disabled,
            id,
        });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "manipulation",
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? draggingOpacity : 1,
    } as const;

    return (
        <div
            className={clsx("sortable-item", { dragging: isDragging })}
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(!useHandle && listeners)}>
            {children({
                handleProps: listeners || {},
                isDragging,
                isActive: Boolean(active?.id === id),
            })}
        </div>
    );
};

const isNumber = (n: unknown): n is number => Number.isFinite(n);
const dynamicColCountFromGrid = (row: Element) => {
    const colCount = window
        .getComputedStyle(row)
        .getPropertyValue("grid-template-columns")
        .split(" ").length;

    return colCount;
};

export interface Props<T> {
    id?: string;
    items: T[];
    useHandle?: boolean;
    disabled?: boolean;
    colWidth: number;
    rowHeight: number;
    getKey(item: T): string;
    children(item: T, i: number, props: RenderProps): JSX.Element;
    onSort(oldIndex: number, newIndex: number): void;
}

export default function SortableVirtualGrid<T>({
    id,
    items,
    useHandle,
    disabled,
    getKey,
    children,
    colWidth,
    rowHeight,
    onSort,
}: Props<T>): JSX.Element | null {
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 20,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const [colCount, setColCount] = useState(1);

    const activeItem = items.find((i) => getKey(i) === activeId);

    const parentRef = useRef<HTMLDivElement>(null);
    const initMeasure = useRef(false);

    const rowCount = Math.ceil(items.length / colCount);

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
    });

    useLayoutEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                const rowEl = entry.target.querySelector(".row");
                if (rowEl) {
                    const count = dynamicColCountFromGrid(rowEl);
                    if (count) {
                        setColCount(count);
                    }
                }
            }
        });
        if (parentRef.current) {
            observer.observe(parentRef.current);
        }
    }, [parentRef.current]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => {
                setActiveId(active.id);
            }}
            onDragEnd={({ active, over }) => {
                if (active?.id !== over?.id) {
                    const oldIndex = active?.data?.current?.sortable?.index;
                    const newIndex = over?.data?.current?.sortable?.index;

                    if (isNumber(oldIndex) && isNumber(newIndex)) {
                        onSort(oldIndex, newIndex);
                    }
                }

                setActiveId(null);
            }}
            onDragCancel={() => setActiveId(null)}>
            <SortableContext items={items.map((i) => getKey(i))}>
                <div
                    {...(disabled ? { inert: "true" } : undefined)}
                    ref={parentRef}
                    className="scrollbar-gray flex-1 overflow-y-auto overflow-x-hidden">
                    <div
                        className="measurer absolute grid w-full gap-3"
                        style={{
                            gridTemplateColumns: `repeat(auto-fill, minmax(${colWidth}px, 1fr))`,
                        }}
                        ref={(e) => {
                            if (e && !initMeasure.current) {
                                const count = dynamicColCountFromGrid(e);
                                if (count) {
                                    initMeasure.current = true;
                                    setColCount(count);
                                }
                            }
                        }}
                    />
                    {parentRef.current && initMeasure.current && (
                        <div
                            className="relative"
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                            }}>
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                return (
                                    <div
                                        key={virtualRow.key}
                                        className="row absolute left-0 top-0 grid w-full gap-2 py-[4px]"
                                        style={{
                                            gridTemplateColumns: `repeat(auto-fill, minmax(${colWidth}px, 1fr))`,
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}>
                                        {Array.from({ length: colCount }).map((_, i) => {
                                            const idx = colCount * virtualRow.index + i;

                                            if (idx >= items.length) return null;
                                            const item = items[idx];

                                            return (
                                                <SortableItem
                                                    key={getKey(item)}
                                                    id={getKey(item)}
                                                    useHandle={useHandle}
                                                    disabled={disabled}>
                                                    {(props) => children(item, idx, props as any)}
                                                </SortableItem>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SortableContext>
            {createPortal(
                <DragOverlay>
                    {activeItem
                        ? children(activeItem, Infinity, {
                              isActive: true,
                              isDragging: true,
                              handleProps: {},
                          } as any)
                        : null}
                </DragOverlay>,
                document.body,
            )}
        </DndContext>
    );
}
