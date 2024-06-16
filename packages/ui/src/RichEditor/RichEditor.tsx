"use client";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { EditorState } from "lexical";
import { ComponentProps, ReactNode } from "react";

import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import { MentionNode } from "./plugins/MentionNode";
import MentionsPlugin from "./plugins/MentionsPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import theme from "./theme";

function Placeholder({ children = "Enter some rich text..." }: { children?: ReactNode }) {
    return (
        <div className="text-muted-foreground pointer-events-none absolute left-4 top-4 inline-block overflow-hidden text-ellipsis text-sm">
            {children}
        </div>
    );
}

const editorConfig = {
    namespace: "Editor",
    theme,
    onError(error: any) {
        throw error;
    },
    nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        MentionNode,
    ],
};

type Props = Omit<ComponentProps<"div">, "onChange"> & {
    placeholder?: ReactNode;
    defaultState?: string;
    onStateChange?: (value: string) => void;
    onMentionsChange?: (mentions: string[]) => void;
};

export default function Editor({
    defaultState,
    onStateChange,
    onMentionsChange,
    placeholder,
    ...props
}: Props) {
    function onChange(editorState: EditorState) {
        const editorStateJSON = editorState.toJSON();

        onStateChange?.(JSON.stringify(editorStateJSON));
    }

    return (
        <LexicalComposer initialConfig={{ ...editorConfig, editorState: defaultState }}>
            <div className="border-border text-foreground ring-offset-background [&:has([role='textbox']:focus-visible)]:ring-ring relative rounded-lg border text-left font-normal leading-5 [&:has([role='textbox']:focus-visible)]:ring-2 [&:has([role='textbox']:focus-visible)]:ring-offset-2">
                <ToolbarPlugin />
                <div className="bg-background relative rounded-b-lg">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="caret-muted-foreground ring-ring ring-offset-background relative min-h-[200px] resize-none space-x-1 rounded-b-lg px-4 py-4 text-sm outline-none"
                                {...props}
                            />
                        }
                        placeholder={<Placeholder>{placeholder}</Placeholder>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <AutoLinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={onChange} />
                    <MentionsPlugin onMentionsChange={onMentionsChange} />
                </div>
            </div>
        </LexicalComposer>
    );
}
