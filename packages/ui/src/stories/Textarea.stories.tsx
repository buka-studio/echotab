import type { Meta, StoryObj } from "@storybook/react";

import { Textarea } from "../Textarea";

const meta = {
  title: "ui/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter your message...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "This is a longer text that spans multiple lines.\nIt shows how the textarea handles content.",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    placeholder: "Invalid textarea",
    "aria-invalid": true,
  },
};

export const WithRows: Story = {
  args: {
    placeholder: "Fixed height textarea",
    rows: 5,
  },
};
