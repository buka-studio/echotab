export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface Choice {
  message: Message;
  logprobs: null | any;
  finish_reason: string;
  index: number;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: Usage;
  choices: Choice[];
}

export interface PromptConfig {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  logprobs?: number | null;
  stop?: string | string[];
}
