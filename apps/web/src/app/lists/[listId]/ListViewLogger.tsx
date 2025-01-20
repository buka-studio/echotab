"use client";

import { useEffect, useRef } from "react";

export default function ListViewLogger({ listId }: { listId: string }) {
  const logging = useRef(false);

  useEffect(() => {
    if (logging.current) return;
    logging.current = true;
    fetch(`/api/lists/${listId}/views`, {
      method: "POST",
    }).finally(() => {
      logging.current = false;
    });
  }, [listId]);

  return null;
}
