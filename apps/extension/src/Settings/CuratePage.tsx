// import { ClipboardFormat, Settings, useUIStore } from "../UIStore";
import Input, { InputProps } from "@echotab/ui/Input";
import { Label } from "@echotab/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@echotab/ui/Select";
import Switch from "@echotab/ui/Switch";
import { forwardRef, useState } from "react";

import { Settings, TimeUnit, timeUnits, useCurateStore } from "../Curate/CurateStore";
import { pluralize } from "../util";

const BlurInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, "onChange" | "value"> & { onChange: (value: number) => void }
>(function BlurInput({ onChange, defaultValue, ...props }, ref) {
  const [value, setValue] = useState(String(defaultValue));

  const onBlur = () => {
    onChange?.(Number(value));
  };

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      ref={ref}
      {...props}
    />
  );
});

export default function CuratePage() {
  const curateStore = useCurateStore();

  const handleOldLinkUpdate = <T extends keyof Settings["oldLinkThreshold"]>(
    value: Settings["oldLinkThreshold"][T],
    prop: T,
  ) => {
    curateStore.updateSettings({
      oldLinkThreshold: {
        ...curateStore.settings.oldLinkThreshold,
        [prop]: value,
      },
    });
  };

  const handleReminderUpdate = <T extends keyof Settings["reminder"]>(
    value: Settings["reminder"][T],
    prop: T,
  ) => {
    curateStore.updateSettings({
      reminder: {
        ...curateStore.settings.reminder,
        [prop]: value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">Link inclusion</div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="old-link-threshold-value">Links older than</Label>
          <div className="flex items-center gap-1">
            <BlurInput
              min={0}
              max={12}
              type="number"
              id="old-link-threshold-value"
              defaultValue={curateStore.settings.oldLinkThreshold.value}
              onChange={(value) => handleOldLinkUpdate(value, "value")}
              className="no-spinner w-16"
            />
            <Select
              value={curateStore.settings.oldLinkThreshold.unit}
              onValueChange={(value) => handleOldLinkUpdate(value as TimeUnit, "unit")}>
              <SelectTrigger className="w-[8.125rem]">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(timeUnits).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {pluralize(curateStore.settings.oldLinkThreshold.value, unit, undefined, false)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">Reminder</div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="reminder-enabled">Enabled</Label>
          <Switch
            id="reminder-enabled"
            checked={curateStore.settings.reminder.enabled}
            onCheckedChange={(v) => {
              handleReminderUpdate(v, "enabled");
            }}
          />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="reminder-interval-value">Remind me after</Label>
          <div className="flex items-center gap-1">
            <BlurInput
              min={0}
              max={12}
              type="number"
              id="reminder-interval-value"
              defaultValue={curateStore.settings.reminder?.value}
              onChange={(value) => handleReminderUpdate(value, "value")}
              className="no-spinner w-16"
            />
            <Select
              value={curateStore.settings.reminder.unit}
              onValueChange={(value) => handleReminderUpdate(value as TimeUnit, "unit")}>
              <SelectTrigger className="w-[8.125rem]">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(timeUnits).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {pluralize(curateStore.settings.reminder.value, unit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
