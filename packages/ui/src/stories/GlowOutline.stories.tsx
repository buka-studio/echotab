import type { Meta, StoryObj } from "@storybook/react";

import GlowOutline from "../GlowOutline";

const meta = {
  title: "ui/GlowOutline",
  component: GlowOutline,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    speed: {
      control: { type: "range", min: 0.1, max: 3, step: 0.1 },
    },
    width: {
      control: { type: "range", min: 1, max: 5, step: 0.5 },
    },
    radius: {
      control: { type: "range", min: 0, max: 24, step: 2 },
    },
  },
} satisfies Meta<typeof GlowOutline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="relative size-48 rounded-lg border">
      <GlowOutline {...args} />
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Content</p>
      </div>
    </div>
  ),
  args: {
    speed: 1,
    width: 1,
    radius: 8,
  },
};

export const Fast: Story = {
  render: () => (
    <div className="relative size-48 rounded-lg border">
      <GlowOutline speed={2} />
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Fast animation</p>
      </div>
    </div>
  ),
};

export const Slow: Story = {
  render: () => (
    <div className="relative size-48 rounded-lg border">
      <GlowOutline speed={0.3} />
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Slow animation</p>
      </div>
    </div>
  ),
};

export const ThickBorder: Story = {
  render: () => (
    <div className="relative size-48 rounded-lg border">
      <GlowOutline width={3} />
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Thick border</p>
      </div>
    </div>
  ),
};

export const RoundedCorners: Story = {
  render: () => (
    <div className="relative size-48 rounded-2xl border">
      <GlowOutline radius={16} />
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Rounded corners</p>
      </div>
    </div>
  ),
};

export const OnCard: Story = {
  render: () => (
    <div className="bg-card relative w-64 rounded-lg border p-6 shadow-sm">
      <GlowOutline />
      <h3 className="text-lg font-semibold">Featured Card</h3>
      <p className="text-muted-foreground mt-2 text-sm">
        This card has a glowing outline effect that draws attention.
      </p>
    </div>
  ),
};
