import { $isListItemNode, $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect } from "react";

export default function ListExitPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const listItem = anchorNode.getParent();

        if (!$isListItemNode(listItem)) {
          return false;
        }

        if (listItem.getTextContent().trim() === "") {
          event?.preventDefault();

          const list = listItem.getParent();
          if ($isListNode(list)) {
            const paragraph = $createParagraphNode();

            if (list.getChildrenSize() === 1) {
              list.replace(paragraph);
            } else {
              listItem.remove();
              list.insertAfter(paragraph);
            }

            paragraph.select();
            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
