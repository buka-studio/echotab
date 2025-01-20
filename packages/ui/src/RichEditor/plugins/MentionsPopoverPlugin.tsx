import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import { $getNodeByKey } from "lexical";
import * as React from "react";
import { useState } from "react";

import { Popover, PopoverAnchor } from "../../Popover";
import { MentionNode } from "./MentionNode";

export default function MentionsPopoverPlugin({
  children,
}: {
  children: (props: { mention: string }) => React.ReactNode;
}) {
  const [mention, setMention] = useState("");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <NodeEventPlugin
        nodeType={MentionNode}
        eventType="click"
        eventListener={(_, editor, nodeKey) => {
          const el = editor.getElementByKey(nodeKey);
          const node = $getNodeByKey(nodeKey);

          if (el && node) {
            setAnchor(el);
            setMention((node as MentionNode).__mention);
          }
        }}
      />
      <NodeEventPlugin
        nodeType={MentionNode}
        eventType="keypress"
        eventListener={(e, editor, nodeKey) => {
          const key = (e as KeyboardEvent).key;
          if (key === " ") {
            const el = editor.getElementByKey(nodeKey);
            const node = $getNodeByKey(nodeKey);

            if (el && node) {
              setAnchor(el);
              setMention((node as MentionNode).__mention);
            }
          }
        }}
      />
      {anchor ? (
        <Popover open={true} onOpenChange={() => setAnchor(null)}>
          <PopoverAnchor virtualRef={{ current: anchor }} />
          {children({
            mention,
          })}
        </Popover>
      ) : null}
    </>
  );
}
