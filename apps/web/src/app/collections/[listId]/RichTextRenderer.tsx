"use client";

import { MentionNode } from "@echotab/ui/RichEditor";
import RichTextRenderer from "@echotab/ui/RichTextRenderer";
import { $createLinkNode, LinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTextNode, $getNodeByKey } from "lexical";
import { ComponentProps, useEffect, useRef } from "react";

import { cn } from "@echotab/ui/util";
import { useListContext } from "./ListContext";


function getMentionElement(element: HTMLElement | null): HTMLElement | null {
  if (!element || element.dataset.lexicalEditor) return null;
  if (!element.dataset.lexicalMention) {
    return getMentionElement(element.parentElement);
  }
  return element;
}

function LinkDecoratorPlugin() {
  const [editor] = useLexicalComposerContext();
  const { links } = useListContext();

  useEffect(() => {
    return editor.registerMutationListener(LinkNode, (mutations) => {
      editor.getEditorState().read(() => {
        for (const [nodeKey, mutation] of mutations) {
          if (mutation === "destroyed") continue;

          const node = $getNodeByKey(nodeKey) as LinkNode | null;
          if (!node) continue;

          const element = editor.getElementByKey(nodeKey);
          if (!element) continue;

          const linkIndex = links.findIndex((l) => l.url === node.getURL());
          if (linkIndex !== -1) {
            element.setAttribute("data-citation", `[${linkIndex + 1}]`);
            element.setAttribute("data-lexical-mention", "true");
            element.setAttribute("data-local-id", links[linkIndex]?.localId ?? "");
          }
        }
      });
    });
  }, [editor, links]);

  return null;
}

function MentionToLinkPlugin() {
  const [editor] = useLexicalComposerContext();
  const { links } = useListContext();

  useEffect(() => {
    return editor.registerNodeTransform(MentionNode, (node) => {
      const localId = node.__mention;
      const linkData = links.find((l) => l.localId === localId);

      if (!linkData) return;

      const text = node.getTextContent();
      const link = $createLinkNode(linkData.url, { target: "_blank", rel: "noopener noreferrer" });
      link.append($createTextNode(text));
      node.replace(link);
    });
  }, [editor, links]);

  return null;
}

function clearHoveredMentions(root: HTMLElement | null) {
  if (!root) return;
  const mentions = root.querySelectorAll('[data-hovered-mention="true"]');
  mentions.forEach((mention) => {
    mention.removeAttribute('data-hovered-mention');
  });
}

function findMentionByLocalId(root: HTMLElement | null, localId: string): HTMLElement | null {
  if (!root) return null;
  return root.querySelector(`[data-local-id="${localId}"]`) as HTMLElement | null;
}

export default function Renderer(props: ComponentProps<typeof RichTextRenderer>) {
  const ref = useRef<HTMLDivElement>(null);
  const { hoveredMention, setHoveredMention } = useListContext();

  useEffect(() => {
    if (!hoveredMention) {
      clearHoveredMentions(ref.current);
      return;
    }

    clearHoveredMentions(ref.current);
    const mention = findMentionByLocalId(ref.current, hoveredMention);
    if (mention) {
      mention.setAttribute('data-hovered-mention', 'true');
    }
  }, [hoveredMention]);

  return (
    <RichTextRenderer
      ref={ref}
      {...props}
      onMouseOver={(e) => {
        if (e.target instanceof HTMLElement) {
          const mentionElement = getMentionElement(e.target);
          if (!mentionElement) return;

          const localId = mentionElement.dataset.localId;
          if (!localId) return;

          setHoveredMention(localId);
          clearHoveredMentions(ref.current);
          mentionElement.setAttribute('data-hovered-mention', 'true');
        }
      }}
      className={cn("[&_a:hover]:underline [&_a]:text-foreground [&_a_span]:text-foreground [&_a]:decoration-muted-foreground [&_a]:font-semibold [&_a:hover]:decoration-foreground ",
        '[&_a:after]:content-[attr(data-citation)] [&_a:after]:text-[0.625rem] [&_a:after]:align-[super] [&_a:after]:text-muted-foreground [&_*:not(a)]:text-muted-foreground [&_a[data-hovered-mention="true"]:after]:text-primary [&_a:after]:font-mono'
      )}
    >
      <MentionToLinkPlugin />
      <LinkDecoratorPlugin />
    </RichTextRenderer>
  );
}
