import { Input } from "@echotab/ui/Input";
import { Label } from "@echotab/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@echotab/ui/Select";
import { Separator } from "@echotab/ui/Separator";
import { Switch } from "@echotab/ui/Switch";
import { ComponentProps, useState } from "react";

import { Settings, TimeUnit, timeUnits, useCurateStore } from "../Curate/CurateStore";
import { pluralize } from "../util";
import { SettingsContent, SettingsPage, SettingsTitle } from "./SettingsLayout";

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

export default function CollectionsPage() {
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

  const handleProfileLinkUpdate = (value: string) => {
    curateStore.updateSettings({
      // profileLink: value,
    });
  };

  return (
    <SettingsPage>
      <SettingsTitle>Collections</SettingsTitle>
      <SettingsContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="old-link-threshold-value">Profile link</Label>
            <div className="text-muted-foreground text-sm">
              Link to your website or social media profile.
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Input
              
              id="profile-link"
              defaultValue={curateStore.settings.oldLinkThreshold.value}
              onChange={(e) => handleProfileLinkUpdate(e.target.value)}
              className=""
            />
            {/* <Select
              value={curateStore.settings.oldLinkThreshold.unit}
              onValueChange={(value) => handleOldLinkUpdate(value as TimeUnit, "unit")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(timeUnits).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {pluralize(curateStore.settings.oldLinkThreshold.value, unit, undefined, false)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>
        </div>

        <Separator />

        {/* <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="reminder-enabled">Reminders enabled</Label>
            <div className="text-muted-foreground text-sm">
              Toggle curation reminders on or off.
            </div>
          </div>
          <Switch
            id="reminder-enabled"
            checked={curateStore.settings.reminder.enabled}
            onCheckedChange={(v) => {
              handleReminderUpdate(v, "enabled");
            }}
          />
        </div> */}
        {/* <Separator /> */}

        {/* <div className="flex items-center justify-between space-x-2">
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
              defaultValue={curateStore.settings.reminder?.value}
              onChange={(value) => handleReminderUpdate(value, "value")}
              className="no-spinner w-16"
            />
            <Select
              value={curateStore.settings.reminder.unit}
              onValueChange={(value) => handleReminderUpdate(value as TimeUnit, "unit")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(timeUnits).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {pluralize(curateStore.settings.reminder.value, unit, undefined, false)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div> */}
      </SettingsContent>
    </SettingsPage>
  );
}
