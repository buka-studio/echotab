import { createHeadlessEditor } from "@echotab/ui/RichTextServerRenderer";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { JSDOM } from "jsdom";
import { $getRoot } from "lexical";

// https://github.com/2wheeh/lexical-nextjs-ssr
function setupDom() {
  const dom = new JSDOM();

  const _window = global.window;
  const _document = global.document;

  // @ts-expect-error
  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51276
  // https://github.com/capricorn86/happy-dom/issues/1227
  global.window = dom.window;
  global.document = dom.window.document;

  return () => {
    global.window = _window;
    global.document = _document;
  };
}

function setupWindow() {
  const _window = global.window;
  // need to setup window for CodeNode since facebook#5828
  // https://github.com/facebook/lexical/pull/5828
  // @ts-expect-error
  global.window = global;

  return () => {
    global.window = _window;
  };
}

export async function getHtml(serializedEditorState: string) {
  const editor = await createHeadlessEditor({ namespace: "html-renderer" });

  return new Promise<string>((resolve) => {
    const cleanupWindow = setupWindow();
    editor.setEditorState(editor.parseEditorState(serializedEditorState));
    cleanupWindow();

    editor.update(() => {
      try {
        const cleanupDom = setupDom();
        const _html = $generateHtmlFromNodes(editor, null);
        cleanupDom();

        resolve(_html);
      } catch (e) {
        console.log(e);
      }
    });
  });
}

export async function getPlainText(serializedEditorState: string) {
  const editor = await createHeadlessEditor({ namespace: "plain-text-renderer" });

  return new Promise<string>((resolve) => {
    editor.setEditorState(editor.parseEditorState(serializedEditorState));

    editor.update(() => {
      try {
        const plainText = $getRoot().getTextContent();

        resolve(plainText);
      } catch (e) {
        console.log(e);
      }
    });
  });
}

export async function getMarkdown(serializedEditorState: string) {
  const editor = await createHeadlessEditor({ namespace: "md-renderer" });

  return new Promise<string>((resolve) => {
    editor.setEditorState(editor.parseEditorState(serializedEditorState));

    editor.update(() => {
      try {
        const md = $convertToMarkdownString(TRANSFORMERS);

        resolve(md);
      } catch (e) {
        console.log(e);
      }
    });
  });
}
