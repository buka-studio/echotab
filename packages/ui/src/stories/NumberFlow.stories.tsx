import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect } from "react";

import { NumberFlow, NumberFlowGroup, continuous } from "../NumberFlow";

const meta = {
  title: "ui/NumberFlow",
  component: NumberFlow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NumberFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function NumberFlowDemo() {
    const [value, setValue] = useState(1234);

    return (
      <div className="flex flex-col items-center gap-4">
        <NumberFlow value={value} className="text-4xl font-bold" />
        <div className="flex gap-2">
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => v + 100)}
          >
            +100
          </button>
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => v - 100)}
          >
            -100
          </button>
        </div>
      </div>
    );
  },
};

export const Currency: Story = {
  render: function CurrencyDemo() {
    const [value, setValue] = useState(1234.56);

    return (
      <div className="flex flex-col items-center gap-4">
        <NumberFlow
          value={value}
          format={{ style: "currency", currency: "USD" }}
          className="text-3xl font-semibold"
        />
        <div className="flex gap-2">
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => v + 10)}
          >
            +$10
          </button>
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => Math.max(0, v - 10))}
          >
            -$10
          </button>
        </div>
      </div>
    );
  },
};

export const Percentage: Story = {
  render: function PercentageDemo() {
    const [value, setValue] = useState(0.75);

    return (
      <div className="flex flex-col items-center gap-4">
        <NumberFlow
          value={value}
          format={{ style: "percent" }}
          className="text-3xl font-semibold"
        />
        <div className="flex gap-2">
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => Math.min(1, v + 0.1))}
          >
            +10%
          </button>
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => Math.max(0, v - 0.1))}
          >
            -10%
          </button>
        </div>
      </div>
    );
  },
};

export const AutoIncrement: Story = {
  render: function AutoIncrementDemo() {
    const [value, setValue] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setValue((v) => v + 1);
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="flex flex-col items-center gap-2">
        <NumberFlow value={value} className="text-5xl font-bold tabular-nums" />
        <p className="text-muted-foreground text-sm">Auto-incrementing every second</p>
      </div>
    );
  },
};

export const Continuous: Story = {
  render: function ContinuousDemo() {
    const [value, setValue] = useState(0);

    return (
      <div className="flex flex-col items-center gap-4">
        <NumberFlow
          value={value}
          plugins={[continuous]}
          className="text-4xl font-bold tabular-nums"
        />
        <div className="flex gap-2">
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => v + 1)}
          >
            +1
          </button>
          <button
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
            onClick={() => setValue((v) => v - 1)}
          >
            -1
          </button>
        </div>
      </div>
    );
  },
};
