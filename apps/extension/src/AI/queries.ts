import { toast } from "@echotab/ui/Toast";
import { useMutation } from "@tanstack/react-query";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import { Tab, Tag } from "~/src/models";
import { useUIStore } from "~/src/UIStore";

const tagSystemPrompt = `Tag saved browser tabs by analyzing their titles and URLs to select the most relevant tags from a provided list. Create new tags only if none apply.

Instructions:

Analyze Content: Identify common themes across all tabs based on titles and URLs.

Select Tags: Prioritize existing tags from the list. Create a new, concise tag only if no existing tags fit.

Limit Tags: Choose up to 5 tags that best represent the shared content across all tabs.

Adapt to Content: Ensure selected tags apply to all tabs, regardless of content type.

Handle Ambiguity: Only use a general tag like "Miscellaneous" if the content is unclear and if you think there are no better tags to apply.`;

const makeTagUserPrompt = (tags: Tag[], tabs: Tab[]) => {
  return `Existing tags: [${tags.map((tag) => `"${tag.name}"`).join(", ")}]\n\nTabs to tag: ${tabs.map((tab) => `[${tab.title}](${tab.url})`).join(", ")}`;
};

const generatedTagSchema = z.object({ tags: z.array(z.string()) });

export function useLLMTagMutation() {
  const uiStore = useUIStore();

  return useMutation({
    mutationFn: async ({ tags, tabs }: { tags: Tag[]; tabs: Tab[] }): Promise<string[]> => {
      if (uiStore.settings.aiApiProvider === "openai") {
        const openai = new OpenAI({
          apiKey: uiStore.settings.aiApiKey,
          dangerouslyAllowBrowser: true,
        });
        // handle openai differently until response_format support is added
        const res = await openai.beta.chat.completions.parse({
          messages: [
            {
              role: "system",
              content: tagSystemPrompt,
            },
            {
              role: "user",
              content: makeTagUserPrompt(tags, tabs),
            },
          ],
          response_format: zodResponseFormat(generatedTagSchema, "tags"),
          temperature: 0.3,
          max_tokens: 100,
          model: "gpt-4o-mini",
        });

        return res.choices[0].message.parsed?.tags || [];
      } else {
        const openai = new OpenAI({
          baseURL: uiStore.settings.aiApiBaseURL,
          apiKey: uiStore.settings.aiApiKey,
          dangerouslyAllowBrowser: true,
        });

        const res = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                tagSystemPrompt +
                `Return ONLY the tags as a string array, eg. ["Tag1", "Tag2"]. Do NOT include any other information.`,
            },
            {
              role: "user",
              content: makeTagUserPrompt(tags, tabs),
            },
          ],
          temperature: 0.3,
          model: uiStore.settings.aiApiModel!,
        });

        const parsedTags = z
          .array(z.string())
          .parse(JSON.parse(res.choices[0].message.content || ""));

        return parsedTags;
      }
    },
    onError: (e) => {
      console.error(e);
      toast.error("Failed to suggest tags. Please try again.");
    },
  });
}

export function useTestLLMMutation() {
  return useMutation({
    mutationFn: async ({
      provider,
      baseURL,
      apiKey,
      model,
    }: {
      provider: "openai" | "custom";
      baseURL?: string;
      apiKey?: string;
      model?: string;
    }) => {
      const init = {
        baseURL,
        apiKey,
        dangerouslyAllowBrowser: true,
      };

      if (provider === "openai") {
        init.baseURL = undefined;
      }

      const openai = new OpenAI(init);
      await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: "Hello, how are you?",
          },
        ],
        model: provider === "openai" ? "gpt-4o-mini" : model!,
      });
    },
    onError: (e) => {
      console.error(e);
      toast.error("Failed to test connection. Please try again.");
    },
    onSuccess: (response) => {
      toast.success("Connection successful!");
    },
  });
}
