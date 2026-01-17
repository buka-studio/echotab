import { Input } from "@echotab/ui/Input";
import { Label } from "@echotab/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@echotab/ui/Select";
import { Separator } from "@echotab/ui/Separator";
import { Switch } from "@echotab/ui/Switch";
import { ComponentProps, useState } from "react";

import { curateStoreActions, Settings, TimeUnit, useCurateStore } from "~/store/curateStore";

import { pluralize } from "../util";
import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

export const timeUnits = ["month", "week", "day"] as const;

function BlurInput({
  onChange,
  defaultValue,
  ...props
}: Omit<ComponentProps<typeof Input>, "onChange" | "value"> & {
  onChange: (value: number) => void;
}) {
  const [value, setValue] = useState(String(defaultValue));

  const onBlur = () => {
    onChange?.(Number(value));
  };

  return (
    <Input
      value={value}
      onChange={(e) => {
        e.stopPropagation();
        setValue(e.target.value);
      }}
      onBlur={onBlur}
      {...props}
    />
  );
}

export default function CuratePage() {
  const settings = useCurateStore((s) => s.settings);

  const handleOldLinkUpdate = <T extends keyof Settings["oldLinkThreshold"]>(
    value: Settings["oldLinkThreshold"][T],
    prop: T,
  ) => {
    curateStoreActions.setCurateSettings({
      oldLinkThreshold: {
        ...settings.oldLinkThreshold,
        [prop]: value,
      },
    });
  };

  const handleReminderUpdate = <T extends keyof Settings["reminder"]>(
    value: Settings["reminder"][T],
    prop: T,
  ) => {
    curateStoreActions.setCurateSettings({
      reminder: {
        ...settings.reminder,
        [prop]: value,
      },
    });
  };

  return (
    <SettingsPage>
      <SettingsTitle>Curate</SettingsTitle>
      <SettingsContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="old-link-threshold-value">Link expiration</Label>
            <div className="text-muted-foreground text-sm">
              How old a link needs to be before it's flagged for curation.
            </div>
          </div>
          <div className="flex items-center gap-1">
            <BlurInput
              min={0}
              max={12}
              type="number"
              id="old-link-threshold-value"
              defaultValue={settings.oldLinkThreshold.value}
              onChange={(value) => handleOldLinkUpdate(value, "value")}
              className="no-spinner w-16"
            />
            <Select
              value={settings.oldLinkThreshold.unit}
              onValueChange={(value) => handleOldLinkUpdate(value as TimeUnit, "unit")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(timeUnits).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {pluralize(settings.oldLinkThreshold.value, unit, undefined, false)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="reminder-enabled">Reminders enabled</Label>
            <div className="text-muted-foreground text-sm">
              Toggle curation reminders on or off.
            </div>
          </div>
          <Switch
            id="reminder-enabled"
            checked={settings.reminder.enabled}
            onCheckedChange={(v) => {
              handleReminderUpdate(v, "enabled");
            }}
          />
        </div>
        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="reminder-interval-value">Reminders frequency</Label>
            <div className="text-muted-foreground text-sm">
              How often you want to be reminded to curate your links.
            </div>
          </div>
          <div className="flex items-center gap-1">
            <BlurInput
              min={0}
              max={12}
              type="number"
              id="reminder-interval-value"
              defaultValue={settings.reminder?.value}
              onChange={(value) => handleReminderUpdate(value, "value")}
              className="no-spinner w-16"
            />
            <Select
              value={settings.reminder.unit}
              onValueChange={(value) => handleReminderUpdate(value as TimeUnit, "unit")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(timeUnits).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {pluralize(settings.reminder.value, unit, undefined, false)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsContent>
    </SettingsPage>
  );
}
