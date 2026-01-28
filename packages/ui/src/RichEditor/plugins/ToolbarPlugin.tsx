import {
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  FontBoldIcon,
  FontItalicIcon,
  ListBulletIcon,
  LockClosedIcon,
  LockOpen1Icon,
  ResetIcon,
  StrikethroughIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  UnderlineIcon,
} from "@radix-ui/react-icons";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { ComponentProps, useCallback, useEffect, useState } from "react";

import { Button } from "../../Button";
import { cn } from "../../util";

function ToolbarButton(props: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      {...props}
    />
  );
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsUnderline(selection.hasFormat("underline"));

      const anchorNode = selection.anchor.getNode();
      const parent = $findMatchingParent(anchorNode, $isListNode);
      setIsBulletList(parent instanceof ListNode && parent.getListType() === "bullet");
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
    );
  }, [updateToolbar, editor]);

  return (
    <div
      className={cn(
        "border-border/50 relative z-20 flex items-center space-x-2 rounded-t-lg border-b px-2 py-2 shadow-sm",
      )}>
      <div
        className={cn("flex flex-1 items-center", {
          "pointer-events-none opacity-40": !isEditable,
        })}>
        <ToolbarButton
          className={cn(isBold ? "bg-muted" : "bg-transparent")}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          }}>
          <FontBoldIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          className={cn(isStrikethrough ? "bg-muted" : "bg-transparent")}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          }}>
          <StrikethroughIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          className={cn(isItalic ? "bg-muted" : "bg-transparent")}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          }}>
          <FontItalicIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          className={cn(isUnderline ? "bg-muted" : "bg-transparent")}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          }}>
          <UnderlineIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>

        <span className="bg-border mx-1 block h-6 w-px"></span>

        <ToolbarButton
          className={cn(isBulletList ? "bg-muted" : "bg-transparent")}
          onClick={() => {
            if (isBulletList) {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }
          }}>
          <ListBulletIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>

        <span className="bg-border mx-1 block h-6 w-px"></span>

        <ToolbarButton
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
          }}>
          <TextAlignLeftIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
          }}>
          <TextAlignCenterIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
          }}>
          <TextAlignRightIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>

        <ToolbarButton
          className={cn("ml-auto")}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}>
          <ResetIcon className="text-foreground h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}>
          <ResetIcon className="text-foreground h-5 w-5 transform-[rotateY(180deg)]" />
        </ToolbarButton>
      </div>
      <ToolbarButton
        onClick={() => {
          editor.setEditable(!isEditable);
        }}>
        {isEditable ? (
          <LockOpen1Icon className="text-foreground h-5 w-5" />
        ) : (
          <LockClosedIcon className="text-foreground h-5 w-5" />
        )}
      </ToolbarButton>
    </div>
  );
}
