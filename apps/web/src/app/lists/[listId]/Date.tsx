"use client";

import { useEffect, useState } from "react";

import { formatDate } from "../../util";

export default function Date({ date }: { date: Date | string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="inline-block h-4 w-[90px] rounded"></span>;
  }

  return <span>{formatDate(date)}</span>;
}
