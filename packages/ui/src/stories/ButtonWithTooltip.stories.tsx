import { PlusIcon, TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";
import type { Meta, StoryObj } from "@storybook/react";

import { ButtonWithTooltip } from "../ButtonWithTooltip";

const meta = {
  title: "ui/ButtonWithTooltip",
  component: ButtonWithTooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm"],
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
  },
} satisfies Meta<typeof ButtonWithTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tooltipText: "Add new item",
    children: <PlusIcon className="size-4" />,
    size: "icon",
  },
};

export const WithText: Story = {
  args: {
    tooltipText: "Click to save your changes",
    children: "Save",
  },
};

export const Destructive: Story = {
  args: {
    tooltipText: "Delete this item",
    children: <TrashIcon className="size-4" />,
    variant: "destructive",
    size: "icon",
  },
};

export const Ghost: Story = {
  args: {
    tooltipText: "Edit",
    children: <Pencil1Icon className="size-4" />,
    variant: "ghost",
    size: "icon-sm",
  },
};

export const CustomTooltipContent: Story = {
  args: {
    tooltipText: "Add item",
    tooltipContent: (
      <div className="flex flex-col gap-1">
        <span className="font-medium">Add new item</span>
        <span className="text-muted-foreground text-xs">Keyboard shortcut: ⌘N</span>
      </div>
    ),
    children: <PlusIcon className="size-4" />,
    size: "icon",
  },
};

export const Sides: Story = {
  render: () => (
    <div className="flex gap-4">
      <ButtonWithTooltip tooltipText="Top tooltip" side="top" size="icon" variant="outline">
        <PlusIcon className="size-4" />
      </ButtonWithTooltip>
      <ButtonWithTooltip tooltipText="Right tooltip" side="right" size="icon" variant="outline">
        <PlusIcon className="size-4" />
      </ButtonWithTooltip>
      <ButtonWithTooltip tooltipText="Bottom tooltip" side="bottom" size="icon" variant="outline">
        <PlusIcon className="size-4" />
      </ButtonWithTooltip>
      <ButtonWithTooltip tooltipText="Left tooltip" side="left" size="icon" variant="outline">
        <PlusIcon className="size-4" />
      </ButtonWithTooltip>
    </div>
  ),
};
