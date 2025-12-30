import { Button } from "@echotab/ui/Button";
import Input from "@echotab/ui/Input";
import { Label } from "@echotab/ui/Label";
import Spinner from "@echotab/ui/Spinner";
import { toast } from "@echotab/ui/Toast";
import { ToggleGroup, ToggleGroupItem } from "@echotab/ui/ToggleGroup";
import { Brain as BrainIcon, OpenAiLogo as OpenAiLogoIcon } from "@phosphor-icons/react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { FormEvent, useRef, useState } from "react";
import { z } from "zod";

import { createLogger } from "~/util/Logger";

import { useTestLLMMutation } from "../AI/queries";
import UIStore, { useUIStore } from "../UIStore";

const logger = createLogger("AIPage");

const customSchema = z.object({
  aiApiBaseURL: z.string().url(),
  aiApiKey: z.string().optional(),
  aiApiModel: z.string(),
});

const openAISchema = z.object({
  aiApiKey: z.string(),
});

function Errors({ errors = [] }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <div>
      {errors.map((err, i) => (
        <p key={i} className="text-destructive-foreground">
          {err}
        </p>
      ))}
    </div>
  );
}

export default function AIPage() {
  const uiStore = useUIStore();
  const provider = uiStore.settings.aiApiProvider;

  const [errors, setErrors] = useState<z.inferFlattenedErrors<typeof customSchema> | undefined>();
  const formRef = useRef<HTMLFormElement>(null);

  const testMutation = useTestLLMMutation();

  const getConfigValues = (form: HTMLFormElement) => {
    const values = new FormData(form);

    return {
      aiApiBaseURL: values.get("aiApiBaseURL")?.toString() || undefined,
      aiApiKey: values.get("aiApiKey")?.toString() || undefined,
      aiApiModel: values.get("aiApiModel")?.toString() || undefined,
    };
  };

  const handleTest = () => {
    testMutation.mutate({
      provider: uiStore.settings.aiApiProvider!,
      baseURL: uiStore.settings.aiApiBaseURL!,
      apiKey: uiStore.settings.aiApiKey!,
      model: uiStore.settings.aiApiModel!,
    });
  };

  const handleSetProvider = (p: "openai" | "custom") => {
    UIStore.updateSettings({ aiApiProvider: p });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors(undefined);

    const values = getConfigValues(e.target as HTMLFormElement);
    const { error } =
      provider === "openai" ? openAISchema.safeParse(values) : customSchema.safeParse(values);
    if (error) {
      logger.error(error);
      setErrors(error.flatten());
      return;
    }

    UIStore.updateSettings(getConfigValues(e.target as HTMLFormElement));

    toast.success("Succesfully updated LLM endpoint configuration!");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground text-sm">LLM endpoint</div>
        <div className="border-border text-muted-foreground mb-5 rounded border border-dashed p-4">
          <InfoCircledIcon className="mr-1 inline text-balance" /> Note: Your API Key is stored{" "}
          <span className="underline">exclusively</span> on your browser and is never sent to our
          servers.
          <p className="mt-3">
            You can also configure a custom LLM provider endpoint that is compatible with OpenAI's
            API such as a proxy or a local server running eg. Ollama.
          </p>
        </div>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} ref={formRef}>
          <div className="text-muted-foreground flex flex-col gap-2 text-sm">
            <Label htmlFor="theme">Provider</Label>
            <ToggleGroup
              defaultValue={uiStore.settings.aiApiProvider}
              className="justify-start"
              id="aiApiProvider"
              variant="outline"
              type="single"
              onValueChange={handleSetProvider}>
              <ToggleGroupItem value="openai" aria-label="Set light theme">
                <OpenAiLogoIcon className="mr-2 h-4 w-4" /> OpenAI
              </ToggleGroupItem>
              <ToggleGroupItem value="custom" aria-label="Set dark theme">
                <BrainIcon className="mr-2 h-4 w-4" /> Custom
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {provider === "custom" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="aiApiBaseURL">Base URL*</Label>
              <Input
                name="aiApiBaseURL"
                placeholder="https://api.openai.com/v1/"
                defaultValue={uiStore.settings.aiApiBaseURL}
              />
              <Errors errors={errors?.fieldErrors?.aiApiBaseURL} />
            </div>
          )}
          {provider && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="aiApiKey">API Key</Label>
              <Input
                name="aiApiKey"
                placeholder="sk-1234567890abcdef"
                defaultValue={uiStore.settings.aiApiKey}
              />
              <Errors errors={errors?.fieldErrors?.aiApiKey} />
            </div>
          )}
          {provider === "custom" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="aiApiModel">Model*</Label>
              <Input
                name="aiApiModel"
                placeholder="gpt-4o-mini"
                defaultValue={uiStore.settings.aiApiModel}
              />
              <Errors errors={errors?.fieldErrors?.aiApiModel} />
            </div>
          )}

          {provider && (
            <div className="flex justify-end gap-2">
              <Button
                key="test"
                variant="ghost"
                className="mr-auto"
                type="button"
                onClick={handleTest}>
                {testMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Test
              </Button>
              <Button className="" variant="outline" key="save">
                Save
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
