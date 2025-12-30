"use client";

import { TRANSFORMERS } from "@lexical/markdown";
import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $createParagraphNode, $getRoot, $nodesOfType, EditorState, LexicalEditor } from "lexical";
import {
  ComponentProps,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { cn } from "../util";
import { defaultNodes } from "./constants";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import { $createMentionNode, MentionNode } from "./plugins/MentionNode";
import MentionsPlugin from "./plugins/MentionsPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import theme from "./theme";

function Placeholder({
  children = "Enter some rich text...\nReference your saved tabs by entering '@' followed by the tab name.",
}: {
  children?: ReactNode;
}) {
  return (
    <div className="text-muted-foreground pointer-events-none absolute top-4 left-4 inline-block overflow-hidden text-sm text-pretty text-ellipsis whitespace-pre">
      {children}
    </div>
  );
}

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme,
  onError(error: any) {
    throw error;
  },
  nodes: [...defaultNodes],
};

type Props = Omit<ComponentProps<"div">, "onChange"> & {
  plugins?: ReactNode;
  config?: Partial<InitialConfigType>;
  placeholder?: ReactNode;
  defaultState?: string;
  defaultMentions?: { value: string; label: string }[];
  onStateChange?: (value: string) => void;
  onMentionsChange?: (mentions: string[]) => void;
};

export interface RichEditorRef {
  addMentions: (mentions: { value: string; label: string }[]) => void;
  getMentions: () => string[];
  clear(): void;
}

function appendMentions(mentions: { value: string; label: string }[]) {
  const root = $getRoot();

  for (const m of mentions) {
    const paragraphNode = $createParagraphNode();
    const mention = $createMentionNode(m.value, m.label);
    paragraphNode.append(mention);
    root.append(paragraphNode);
  }
}

const RichEditor = forwardRef<RichEditorRef, Props>(function RichEditor(
  {
    defaultState,
    defaultMentions,
    onStateChange,
    onMentionsChange,
    placeholder,
    className,
    config,
    plugins,
    ...props
  }: Props,
  ref,
) {
  const editor = useRef<LexicalEditor>(null);

  function onChange(editorState: EditorState) {
    const editorStateJSON = editorState.toJSON();

    onStateChange?.(JSON.stringify(editorStateJSON));
  }

  // there's probably be a better way to do this
  useEffect(() => {
    editor.current?.update(
      () => {
        if (defaultMentions?.length) {
          appendMentions(defaultMentions);

          const addedMentions = defaultMentions.map((m) => m.value);
          onMentionsChange?.(addedMentions);
        }
      },
      {
        onUpdate: () => {
          const state = editor.current?.getEditorState().toJSON()!;
          onStateChange?.(JSON.stringify(state));
        },
      },
    );
  }, []);

  useImperativeHandle(ref, () => ({
    addMentions: (mentions: { value: string; label: string }[]) => {
      editor.current?.update(() => {
        appendMentions(mentions);
      });
    },
    getMentions: () => {
      const mentions = editor.current?.getEditorState().read(() => {
        const mentionNodes = $nodesOfType(MentionNode);
        const mentions = mentionNodes.map((node) => node.__mention);

        return mentions;
      });

      return mentions ?? [];
    },
    clear: () => {
      editor.current?.update(() => {
        const root = $getRoot();
        root.clear();
      });
    },
  }));

  return (
    <LexicalComposer initialConfig={{ ...editorConfig, ...config, editorState: defaultState }}>
      <div className="border-border text-foreground ring-offset-background [&:has([role='textbox']:focus-visible)]:ring-ring relative rounded-lg border text-left leading-5 font-normal [&:has([role='textbox']:focus-visible)]:ring-2 [&:has([role='textbox']:focus-visible)]:ring-offset-2">
        <ToolbarPlugin />
        <div className="bg-background relative rounded-b-lg">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  "caret-muted-foreground ring-ring ring-offset-background relative min-h-[200px] resize-none space-x-1 rounded-b-lg px-4 py-4 text-sm outline-none",
                  className,
                )}
                {...props}
              />
            }
            placeholder={<Placeholder>{placeholder}</Placeholder>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={onChange} />
          <MentionsPlugin onMentionsChange={onMentionsChange} />
          <EditorRefPlugin editorRef={editor} />
          {plugins}
        </div>
      </div>
    </LexicalComposer>
  );
});

export default RichEditor;
