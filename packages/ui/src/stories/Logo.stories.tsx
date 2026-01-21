import type { Meta, StoryObj } from "@storybook/react";

import Logo from "../Logo";

const meta = {
  title: "ui/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    width: 32,
    height: 32,
  },
};

export const Large: Story = {
  args: {
    width: 120,
    height: 120,
  },
};

export const CustomColor: Story = {
  args: {
    className: "text-primary",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Logo width={24} height={24} />
      <Logo width={32} height={32} />
      <Logo width={48} height={48} />
      <Logo width={64} height={64} />
      <Logo width={96} height={96} />
    </div>
  ),
};

export const WithBackground: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-lg p-2">
        <Logo className="size-full" />
      </div>
      <div className="bg-secondary text-secondary-foreground flex size-16 items-center justify-center rounded-lg p-2">
        <Logo className="size-full" />
      </div>
      <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-lg p-2">
        <Logo className="size-full" />
      </div>
    </div>
  ),
};
