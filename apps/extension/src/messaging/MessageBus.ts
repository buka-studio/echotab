import { createLogger } from "~/util/Logger";

import type { HandlerMap, Message, MessagePayload, MessageResponse, MessageType } from "./types";

const logger = createLogger("MessageBus");

type SendOptions = {
  timeout?: number;
};

export class MessageBus {
  static send<T extends MessageType>(
    type: T,
    ...args: keyof MessagePayload<T> extends never
      ? [options?: SendOptions]
      : [payload: MessagePayload<T>, options?: SendOptions]
  ): Promise<MessageResponse<T>> {
    const [payloadOrOptions, maybeOptions] = args;
    const payload = (maybeOptions !== undefined ? payloadOrOptions : {}) as MessagePayload<T>;
    const options = (maybeOptions !== undefined ? maybeOptions : payloadOrOptions) as
      | SendOptions
      | undefined;

    const message = { type, ...payload } as Message;

    const sendPromise = new Promise<MessageResponse<T>>((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (options?.timeout) {
      return Promise.race([
        sendPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${type} timed out`)), options.timeout),
        ),
      ]);
    }

    return sendPromise;
  }

  static sendToTab<T extends MessageType>(
    tabId: number,
    type: T,
    ...args: keyof MessagePayload<T> extends never
      ? [options?: SendOptions]
      : [payload: MessagePayload<T>, options?: SendOptions]
  ): Promise<MessageResponse<T>> {
    const [payloadOrOptions, maybeOptions] = args;
    const payload = (maybeOptions !== undefined ? payloadOrOptions : {}) as MessagePayload<T>;
    const options = (maybeOptions !== undefined ? maybeOptions : payloadOrOptions) as
      | SendOptions
      | undefined;

    const message = { type, ...payload } as Message;

    const sendPromise = new Promise<MessageResponse<T>>((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    if (options?.timeout) {
      return Promise.race([
        sendPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${type} timed out`)), options.timeout),
        ),
      ]);
    }

    return sendPromise;
  }

  static async broadcast<T extends MessageType>(
    type: T,
    ...args: keyof MessagePayload<T> extends never ? [] : [payload: MessagePayload<T>]
  ): Promise<void> {
    const [payload] = args;
    const message = { type, ...(payload || {}) } as Message;

    const tabs = await chrome.tabs.query({});
    await Promise.allSettled(
      tabs
        .filter((t) => t.id)
        .map(
          (t) =>
            new Promise<void>((resolve) => {
              chrome.tabs.sendMessage(t.id!, message, () => {
                resolve();
              });
            }),
        ),
    );
  }

  static createListener(handlers: HandlerMap) {
    return (
      message: Message,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void,
    ): boolean => {
      const handler = handlers[message.type] as
        | ((payload: unknown, sender: chrome.runtime.MessageSender) => unknown)
        | undefined;

      if (!handler) {
        return false;
      }

      const { type: _, ...payload } = message;
      const result = handler(payload, sender);

      if (result instanceof Promise) {
        result.then(sendResponse).catch((error) => {
          logger.error(`Error handling ${message.type}:`, error);
          sendResponse({ error: error.message });
        });
        return true;
      }

      sendResponse(result);
      return false;
    };
  }
}
