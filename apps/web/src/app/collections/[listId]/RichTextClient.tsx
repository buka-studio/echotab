"use client";

import { ReactNode, useSyncExternalStore } from "react";

import Renderer from "./RichTextRenderer";

const emptySubscribe = () => () => {};

function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client
    () => false, // server
  );
}

export default function RichTextHydrator({
  editorState,
  children,
}: {
  editorState: string;
  children: ReactNode;
}) {
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <>{children}</>;
  }

  return <Renderer editorState={editorState} />;
}
