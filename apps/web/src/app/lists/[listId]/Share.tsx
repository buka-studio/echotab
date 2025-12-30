"use client";

import { PublicList } from "@echotab/lists/models";
import { Button } from "@echotab/ui/Button";
import { Label } from "@echotab/ui/Label";
import { XLogo as XLogoIcon } from "@phosphor-icons/react";
import { CopyIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { renderSVG } from "uqr";

function CopyToClipboard({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
    });
  };

  return (
    <Button onClick={handleCopy} variant="outline">
      <CopyIcon className="mr-2" /> {copied ? "Link Copied!" : "Copy Link"}
    </Button>
  );
}

function buildTwitterShareLink(list: PublicList) {
  const params = new URLSearchParams();
  params.set("text", `Check out this list: ${list.title}`);
  params.set("url", `${process.env.NEXT_PUBLIC_WEB_HOST}/lists/${list.publicId}`);
  params.set("hashtags", "echotab");

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export default function Share({ list }: { list: PublicList }) {
  const listUrl = `${process.env.NEXT_PUBLIC_WEB_HOST}/lists/${list.publicId}`;

  const qr = renderSVG(listUrl, {
    blackColor: "var(--foreground)",
    whiteColor: "var(--background)",
  });

  return (
    <div className="flex flex-col gap-10 p-5">
      <div className="mx-auto flex w-full max-w-[200px] flex-col items-center justify-center gap-2 *:w-full">
        <CopyToClipboard content={listUrl} />
        <Button variant="outline" asChild>
          <a href={buildTwitterShareLink(list)} target="_blank" rel="noopener noreferrer">
            Share on <XLogoIcon className="ml-2" />
          </a>
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Label>QR Code</Label>
        <div
          dangerouslySetInnerHTML={{ __html: qr }}
          className="border-border aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border shadow sm:w-[200px]"
        />
      </div>
    </div>
  );
}
