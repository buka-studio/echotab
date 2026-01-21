"use client";

import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ComponentProps, ReactNode } from "react";

import { defaultNodes } from "./constants";
import theme from "./theme";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme,
  onError(error: any) {
    throw error;
  },
  editable: false,
  nodes: [...defaultNodes],
};

function Placeholder({ children = "Enter some rich text..." }: { children?: ReactNode }) {
  return (
    <div className="text-muted-foreground pointer-events-none absolute left-4 top-4 inline-block overflow-hidden text-ellipsis text-sm">
      {children}
    </div>
  );
}

type Props = Omit<ComponentProps<"div">, "onChange"> & {
  editorState: string;
};

function RichTextRenderer(
  { editorState, ref, ...props }: Props,
) {
  return (
    <LexicalComposer initialConfig={{ ...editorConfig, editorState }}>
      <div className="text-foreground text-left font-normal leading-5" ref={ref}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="caret-muted-foreground relative resize-none space-x-1 rounded-b-lg text-sm outline-none"
              {...props}
              aria-placeholder="No content"
              placeholder={<Placeholder>No content</Placeholder>}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  );
}

export default RichTextRenderer;
