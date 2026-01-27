"use client";

import { PublicList } from "@echotab/lists/models";
import { Button } from "@echotab/ui/Button";
import { XLogoIcon } from "@phosphor-icons/react";
import { renderSVG } from "uqr";

import CopyButton from "./CopyButton";

function buildTwitterShareLink(list: PublicList) {
  const params = new URLSearchParams();
  params.set("text", `Check out this list: ${list.title}`);
  params.set("url", `${process.env.NEXT_PUBLIC_WEB_HOST}/collections/${list.publicId}`);
  params.set("hashtags", "echotab");

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export default function Share({ list }: { list: PublicList }) {
  const listUrl = `${process.env.NEXT_PUBLIC_WEB_HOST}/lists/${list.publicId}`;

  const qr = renderSVG(listUrl, {
    blackColor: "var(--foreground)",
    whiteColor: "var(--popover)",
  });

  return (
    <div className="flex flex-col gap-10 p-5 sm:flex-row sm:p-0">
      <div className="mx-auto flex w-full max-w-[200px] flex-col items-center justify-center gap-2 *:w-full sm:max-w-none">
        <div className="text-muted-foreground text-left text-sm">
          Scan code or use the link below to share this list.
        </div>
        <CopyButton value={listUrl} variant="secondary">
          Copy URL
        </CopyButton>
        <Button variant="secondary" asChild className="gap-1">
          <a href={buildTwitterShareLink(list)} target="_blank" rel="noopener noreferrer">
            Share on <XLogoIcon />
          </a>
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div
          dangerouslySetInnerHTML={{ __html: qr }}
          className="aspect-square w-full max-w-[200px] overflow-hidden rounded-lg sm:w-[150px]"
        />
      </div>
    </div>
  );
}
