import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
    FontBoldIcon,
    FontItalicIcon,
    ResetIcon,
    StrikethroughIcon,
    TextAlignCenterIcon,
    TextAlignJustifyIcon,
    TextAlignLeftIcon,
    TextAlignRightIcon,
    UnderlineIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import {
    $getSelection,
    $isRangeSelection,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    REDO_COMMAND,
    UNDO_COMMAND,
} from "lexical";
import React from "react";

import Button from "../../Button";

export default function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = React.useState(false);
    const [isItalic, setIsItalic] = React.useState(false);
    const [isStrikethrough, setIsStrikethrough] = React.useState(false);
    const [isUnderline, setIsUnderline] = React.useState(false);

    const updateToolbar = React.useCallback(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));
            setIsUnderline(selection.hasFormat("underline"));
        }
    }, [editor]);

    React.useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
        );
    }, [updateToolbar, editor]);

    return (
        <div className="border-border/50 bg-card relative z-20 flex items-center space-x-2 rounded-t-lg border-b px-2 py-2 shadow-sm">
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("", isBold ? "bg-muted" : "bg-transparent")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                }}>
                <FontBoldIcon className="text-foreground h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("", isStrikethrough ? "bg-muted" : "bg-transparent")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
                }}>
                <StrikethroughIcon className="text-foreground h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("", isItalic ? "bg-muted" : "bg-transparent")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                }}>
                <FontItalicIcon className="text-foreground h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("", isUnderline ? "bg-muted" : "bg-transparent")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                }}>
                <UnderlineIcon className="text-foreground h-5 w-5" />
            </Button>

            <span className="bg-border block h-6 w-[1px]"></span>

            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
                }}>
                <TextAlignLeftIcon className="text-foreground h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
                }}>
                <TextAlignCenterIcon className="text-foreground h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
                }}>
                <TextAlignRightIcon className="text-foreground h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("")}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
                }}>
                <TextAlignJustifyIcon className="text-foreground h-5 w-5" />
            </Button>

            <span className="bg-border ml-auto block h-6 w-[1px]"></span>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("")}
                onClick={() => {
                    editor.dispatchCommand(UNDO_COMMAND, undefined);
                }}>
                <ResetIcon className="text-foreground h-5 w-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className={clsx("")}
                onClick={() => {
                    editor.dispatchCommand(REDO_COMMAND, undefined);
                }}>
                <ResetIcon className="text-foreground h-5 w-5 [transform:rotateY(180deg)]" />
            </Button>
        </div>
    );
}
