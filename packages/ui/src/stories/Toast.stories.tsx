import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../Button";
import { toast, Toaster } from "../Toast";

const meta = {
  title: "ui/Toast",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster position="bottom-right" />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast("This is a default toast message")}>Show Toast</Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success("Operation completed successfully!")}>
      Show Success Toast
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button onClick={() => toast.error("Something went wrong. Please try again.")}>
      Show Error Toast
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button onClick={() => toast.warning("Please review before continuing.")}>
      Show Warning Toast
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button onClick={() => toast.info("Here is some useful information.")}>Show Info Toast</Button>
  ),
};

export const Loading: Story = {
  render: () => (
    <Button
      onClick={() => {
        const toastId = toast.loading("Loading...");
        setTimeout(() => {
          toast.success("Done!", { id: toastId });
        }, 2000);
      }}
    >
      Show Loading Toast
    </Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("Event Created", {
          description: "Your event has been scheduled for tomorrow at 3pm.",
        })
      }
    >
      Show Toast with Description
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("File deleted", {
          action: {
            label: "Undo",
            onClick: () => toast.success("File restored!"),
          },
        })
      }
    >
      Show Toast with Action
    </Button>
  ),
};
