import type { Meta, StoryObj } from "@storybook/react";

import { Spinner } from "../Spinner";

const meta = {
  title: "ui/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    className: "size-4",
  },
};

export const Large: Story = {
  args: {
    className: "size-12",
  },
};

export const CustomColor: Story = {
  args: {
    className: "text-primary size-8",
  },
};

export const InButton: Story = {
  render: () => (
    <button
      disabled
      className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium opacity-70"
    >
      <Spinner className="size-4" />
      Loading...
    </button>
  ),
};
