"use client";

import RichTextRenderer from "@echotab/ui/RichTextRenderer";
import { ComponentProps, useEffect, useRef } from "react";

import { useListContext } from "./ListContext";

export default function Renderer(props: ComponentProps<typeof RichTextRenderer>) {
  const ref = useRef<HTMLDivElement>(null);
  const { hoveredMention, setHoveredMention } = useListContext();

  // todo: super hacky, refactor this
  useEffect(() => {
    if (hoveredMention) {
      const targetMentions = Array.from(
        ref.current?.querySelectorAll(`[data-mention="${hoveredMention}"]`) || [],
      );

      const mentions = Array.from(ref?.current?.querySelectorAll("[data-mention]") || []);

      for (const m of mentions) {
        m.setAttribute("tabindex", "-1");
        m.classList.remove("ring", "ring-ring", "ring-1");
      }

      for (const m of targetMentions) {
        m.classList.add(..."bg-card ring-ring ring ring-1".split(" "));
      }
    }
  }, [hoveredMention]);

  const handleMentionClick = (mentionId: string) => {
    const mentionLink = document.querySelector(`[data-mention="${mentionId}"]`);
    if (mentionLink) {
      mentionLink.scrollIntoView({ behavior: "smooth" });
      setHoveredMention(mentionId);
    }
  };

  return (
    <RichTextRenderer
      ref={ref}
      {...props}
      onClick={(e) => {
        if (e.target instanceof HTMLElement) {
          if (e.target.dataset.lexicalMention === "true") {
            handleMentionClick(e.target.dataset.mention!);
          }
        }
      }}
      onMouseOver={(e) => {
        if (e.target instanceof HTMLElement) {
          if (e.target.dataset.lexicalMention === "true") {
            setHoveredMention(e.target.dataset.mention!);
          }
        }
      }}
    />
  );
}
