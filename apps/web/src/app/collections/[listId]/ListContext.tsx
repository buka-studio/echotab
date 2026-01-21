"use client";

import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

interface ListContext {
  hoveredMention: string | null;
  setHoveredMention: Dispatch<SetStateAction<string | null>>;
}

const ListContext = createContext<ListContext>({
  hoveredMention: null,
  setHoveredMention: () => {},
});

export function useListContext() {
  return useContext(ListContext);
}

const ListContextProvider = ({ children }: { children: ReactNode }) => {
  const [hoveredMention, setHoveredMention] = useState<string | null>(null);

  return (
    <ListContext.Provider value={{ hoveredMention, setHoveredMention }}>
      {children}
    </ListContext.Provider>
  );
};

export default ListContextProvider;
