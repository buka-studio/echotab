"use client";

import { Button } from "@echotab/ui/Button";
import { ButtonWithTooltip } from "@echotab/ui/ButtonWithTooltip";
import { toast } from "@echotab/ui/Toast";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeaderCTA() {
  const [installed, setInstalled] = useState(false);
  const [canInteract, setCanInteract] = useState(false);
  const params = useParams<{ listId: string }>();

  useEffect(() => {
    setCanInteract(Boolean(typeof window !== "undefined" && window.chrome));

    (async function getVersion() {
      try {
        const res = await chrome.runtime.sendMessage(process.env.NEXT_PUBLIC_EXTENSION_ID, {
          action: "version",
        });
        setInstalled(true);
      } catch (e) {
        console.info(e);
        // no extension installed
      }
    })();
  }, []);

  const handleImportList = async () => {
    try {
      await chrome.runtime.sendMessage(process.env.NEXT_PUBLIC_EXTENSION_ID, {
        action: "import-list",
        data: { listId: params.listId },
      });
      toast.success("List imported successfully");
    } catch (e) {
      // todo: handle error
      console.error(e);
      toast.error("Failed to import list");
    }
  };

  if (!canInteract) {
    return (
      <ButtonWithTooltip
        className="cursor-not-allowed opacity-50"
        tooltipText="EchoTab is currently only available for Chromium browsers.">
        Install EchoTab
      </ButtonWithTooltip>
    );
  }

  if (installed) {
    return (
      <Button onClick={handleImportList} variant="outline">
        Import List
      </Button>
    );
  }

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
