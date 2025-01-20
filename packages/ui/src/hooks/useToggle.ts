import { useCallback, useState } from "react";

export default function useToggle(initial = false): [boolean, (force?: unknown) => void] {
  const [state, setState] = useState(initial);
  const toggle = useCallback(
    (force?: unknown) => setState((state) => (typeof force === "boolean" ? force : !state)),
    [],
  );

  return [state, toggle];
}
