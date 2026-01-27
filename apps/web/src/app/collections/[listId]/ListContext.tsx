"use client";

import { PublicLink } from "@echotab/lists/models";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

interface ListContext {
  hoveredMention: string | null;
  setHoveredMention: Dispatch<SetStateAction<string | null>>;
  links: PublicLink[];
}

const ListContext = createContext<ListContext>({
  hoveredMention: null,
  setHoveredMention: () => { },
  links: [],
});

export function useListContext() {
  return useContext(ListContext);
}

const ListContextProvider = ({ children, links = [] }: { children: ReactNode; links?: PublicLink[] }) => {
  const [hoveredMention, setHoveredMention] = useState<string | null>(null);

  return (
    <ListContext.Provider value={{ hoveredMention, setHoveredMention, links }}>
      {children}
    </ListContext.Provider>
  );
};

export default ListContextProvider;