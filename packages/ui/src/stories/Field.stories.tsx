import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "../Checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "../Field";
import { Input } from "../Input";
import { RadioGroup, RadioGroupItem } from "../RadioGroup";
import { Switch } from "../Switch";

const meta = {
  title: "ui/Field",
  component: Field,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <Field orientation="vertical" className="w-[300px]">
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" placeholder="Enter your email" />
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal" className="w-[400px]">
      <FieldLabel htmlFor="name">Name</FieldLabel>
      <Input id="name" placeholder="Enter your name" />
    </Field>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Field orientation="vertical" className="w-[300px]">
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <FieldContent>
        <Input id="username" placeholder="Choose a username" />
        <FieldDescription>This will be your public display name.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field orientation="vertical" className="w-[300px]" data-invalid="true">
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <FieldContent>
        <Input id="password" type="password" aria-invalid="true" />
        <FieldError>Password must be at least 8 characters.</FieldError>
      </FieldContent>
    </Field>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="terms" />
      <FieldContent>
        <FieldLabel htmlFor="terms">Accept terms and conditions</FieldLabel>
        <FieldDescription>
          You agree to our Terms of Service and Privacy Policy.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const WithSwitch: Story = {
  render: () => (
    <Field orientation="horizontal" className="w-[400px]">
      <FieldContent>
        <FieldLabel htmlFor="notifications">Enable notifications</FieldLabel>
        <FieldDescription>Receive notifications about updates.</FieldDescription>
      </FieldContent>
      <Switch id="notifications" />
    </Field>
  ),
};

export const FieldSetExample: Story = {
  render: () => (
    <FieldSet className="w-[300px]">
      <FieldLegend>Account Settings</FieldLegend>
      <FieldGroup>
        <Field orientation="vertical">
          <FieldLabel htmlFor="fs-email">Email</FieldLabel>
          <Input id="fs-email" type="email" />
        </Field>
        <Field orientation="vertical">
          <FieldLabel htmlFor="fs-password">Password</FieldLabel>
          <Input id="fs-password" type="password" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
