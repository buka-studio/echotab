import type { TabMetadata, TabMetadataRequest } from "~/TabInfo/models";

export type Message =
  | { type: "tab:info" }
  | { type: "tab:close"; tabId: number; saveId?: string }
  | { type: "version:get" }
  | { type: "list:import"; listId: string }
  | { type: "snapshot:capture" }
  | { type: "snapshot:save"; savedId: string }
  | { type: "widget:toggle" }
  | { type: "snapshot:ready"; tabId: number; url: string }
  | ({ type: "metadata:fetch" } & TabMetadataRequest);

export type MessageType = Message["type"];

export type MessageOfType<T extends MessageType> = Extract<Message, { type: T }>;

export type MessagePayload<T extends MessageType> = Omit<MessageOfType<T>, "type">;

export interface ResponseMap {
  "tab:info": { tab: chrome.tabs.Tab };
  "tab:close": void;
  "version:get": { version: string };
  "list:import": { success: boolean };
  "snapshot:capture": { success: boolean; dataUrl?: string; error?: string };
  "snapshot:save": { success: boolean; error?: string };
  "widget:toggle": void;
  "snapshot:ready": void;
  "metadata:fetch": { success: boolean; metadata?: TabMetadata; error?: string };
}

export type MessageResponse<T extends MessageType> = ResponseMap[T];

export type MessageHandler<T extends MessageType> = (
  payload: MessagePayload<T>,
  sender: chrome.runtime.MessageSender,
) => Promise<MessageResponse<T>> | MessageResponse<T>;

export type HandlerMap = {
  [K in MessageType]?: MessageHandler<K>;
};
