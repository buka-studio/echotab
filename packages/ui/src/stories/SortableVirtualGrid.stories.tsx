import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import SortableVirtualGrid from "../SortableVirtualGrid";

const meta = {
  title: "ui/SortableVirtualGrid",
  component: SortableVirtualGrid,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SortableVirtualGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

interface GridItem {
  id: string;
  title: string;
  color: string;
}

const generateItems = (count: number): GridItem[] => {
  const colors = [
    "bg-red-100 dark:bg-red-900/30",
    "bg-blue-100 dark:bg-blue-900/30",
    "bg-green-100 dark:bg-green-900/30",
    "bg-yellow-100 dark:bg-yellow-900/30",
    "bg-purple-100 dark:bg-purple-900/30",
    "bg-pink-100 dark:bg-pink-900/30",
    "bg-orange-100 dark:bg-orange-900/30",
    "bg-teal-100 dark:bg-teal-900/30",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    title: `Item ${i + 1}`,
    color: colors[i % colors.length],
  }));
};

const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
};

export const Default: Story = {
  render: function SortableGridDemo() {
    const [items, setItems] = useState(() => generateItems(50));

    return (
      <div className="h-[500px] w-full p-4">
        <SortableVirtualGrid
          items={items}
          getKey={(item) => item.id}
          colWidth={150}
          rowHeight={120}
          onSort={(oldIndex, newIndex) => {
            setItems((items) => arrayMove(items, oldIndex, newIndex));
          }}
        >
          {(item, _index, { handleProps, isDragging }) => (
            <div
              className={`${item.color} flex h-[100px] flex-col items-center justify-center rounded-lg border p-4 ${
                isDragging ? "ring-primary ring-2" : ""
              }`}
            >
              <span className="font-medium">{item.title}</span>
            </div>
          )}
        </SortableVirtualGrid>
      </div>
    );
  },
};

export const WithHandle: Story = {
  render: function SortableGridWithHandleDemo() {
    const [items, setItems] = useState(() => generateItems(30));

    return (
      <div className="h-[500px] w-full p-4">
        <SortableVirtualGrid
          items={items}
          getKey={(item) => item.id}
          colWidth={180}
          rowHeight={100}
          useHandle
          onSort={(oldIndex, newIndex) => {
            setItems((items) => arrayMove(items, oldIndex, newIndex));
          }}
        >
          {(item, _index, { handleProps, isDragging }) => (
            <div
              className={`${item.color} flex h-[80px] items-center gap-3 rounded-lg border px-3 ${
                isDragging ? "ring-primary ring-2" : ""
              }`}
            >
              <button
                className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                {...handleProps}
              >
                <DragHandleDots2Icon className="size-5" />
              </button>
              <span className="font-medium">{item.title}</span>
            </div>
          )}
        </SortableVirtualGrid>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: function DisabledGridDemo() {
    const [items] = useState(() => generateItems(20));

    return (
      <div className="h-[400px] w-full p-4">
        <SortableVirtualGrid
          items={items}
          getKey={(item) => item.id}
          colWidth={150}
          rowHeight={120}
          disabled
          onSort={() => {}}
        >
          {(item) => (
            <div
              className={`${item.color} flex h-[100px] flex-col items-center justify-center rounded-lg border p-4 opacity-60`}
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground text-xs">Disabled</span>
            </div>
          )}
        </SortableVirtualGrid>
      </div>
    );
  },
};

export const ManyItems: Story = {
  render: function ManyItemsDemo() {
    const [items, setItems] = useState(() => generateItems(500));

    return (
      <div className="h-[600px] w-full p-4">
        <p className="text-muted-foreground mb-4 text-sm">
          This grid contains 500 items with virtualization for performance.
        </p>
        <SortableVirtualGrid
          items={items}
          getKey={(item) => item.id}
          colWidth={120}
          rowHeight={100}
          onSort={(oldIndex, newIndex) => {
            setItems((items) => arrayMove(items, oldIndex, newIndex));
          }}
        >
          {(item, index, { isDragging }) => (
            <div
              className={`${item.color} flex h-[80px] flex-col items-center justify-center rounded-lg border ${
                isDragging ? "ring-primary ring-2" : ""
              }`}
            >
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-muted-foreground text-xs">#{index + 1}</span>
            </div>
          )}
        </SortableVirtualGrid>
      </div>
    );
  },
};
