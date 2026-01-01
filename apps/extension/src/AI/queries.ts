import { toast } from "@echotab/ui/Toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import { ActiveTab, SavedTab, Tag } from "../models";
import { useUIStore } from "../UIStore";
import { createLogger } from "../util/Logger";

const logger = createLogger("AI");

const tagSystemPrompt = `Tag saved browser tabs by analyzing their titles, URLs and optional metadata to select the most relevant tags from a provided list. Create new tags only if none apply.

Instructions:

Analyze Content: Identify common themes across all tabs based on titles and URLs.

Select Tags: Prioritize existing tags from the list. Create a new, concise tag only if no existing tags fit.

Limit Tags: Choose up to 5 tags that best represent the shared content across all tabs.

Adapt to Content: Ensure selected tags apply to all tabs, regardless of content type.

Handle Ambiguity: Only use a general tag like "Miscellaneous" if the content is unclear and if you think there are no better tags to apply.`;

const makeTagUserPrompt = (tags: Tag[], tabs: ActiveTab[]) => {
  return `Existing tags: [${tags.map((tag) => `"${tag.name}"`).join(", ")}]\n\nTabs to tag: ${tabs.map((tab) => `[${tab.title}](${tab.url}) ${tab.metadata ? JSON.stringify(tab.metadata) : ""}`).join(", ")}`;
};

const generatedTagSchema = z.object({ tags: z.array(z.string()) });

export function useLLMTagMutation() {
  const uiStore = useUIStore();

  return useMutation({
    mutationFn: async ({ tags, tabs }: { tags: Tag[]; tabs: ActiveTab[] }): Promise<string[]> => {
      const openai = new OpenAI({
        baseURL: uiStore.settings.aiApiBaseURL,
        apiKey: uiStore.settings.aiApiKey,
        dangerouslyAllowBrowser: true,
      });

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
    },
    onError: (e) => {
      logger.error("Failed to suggest tags", e);
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
      logger.error("Failed to test connection", e);
      toast.error("Failed to test connection. Please try again.");
    },
    onSuccess: (response) => {
      toast.success("Connection successful!");
    },
  });
}

const summarizeSystemPrompt = `Summarize the following link's content into a short description of up to 75 words. Return ONLY the description. Make sure to include the most important information and make sure it's grammatically correct.`;

export function useLLMSummarizeQuery({ tab }: { tab: SavedTab }) {
  const uiStore = useUIStore();

  return useQuery({
    queryKey: ["llm-summarize", tab.id],
    enabled: Boolean(uiStore.settings.aiApiProvider),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: "always",
    queryFn: async () => {
      const openai = new OpenAI({
        baseURL: uiStore.settings.aiApiBaseURL,
        apiKey: uiStore.settings.aiApiKey,
        dangerouslyAllowBrowser: true,
      });

      const res = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: summarizeSystemPrompt,
          },
          {
            role: "user",
            content: JSON.stringify(tab),
          },
        ],
        model: "gpt-4o-mini",
      });

      return res.choices[0].message.content?.trim();
    },
  });
}
