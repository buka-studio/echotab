"use client";

import { Button } from "@echotab/ui/Button";

export default function HeaderCTA() {
  return (
    <Button asChild variant="outline">
      <a
        href={`https://chromewebstore.google.com/detail/cmdtab/${process.env.NEXT_PUBLIC_EXTENSION_ID}`}
        target="_blank"
        rel="noopener noreferrer">
        Install EchoTab
      </a>
    </Button>
  );
}
