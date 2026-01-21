import { getPublicList } from "@echotab/lists/ListService";
import { cache } from "react";

export const fetchPublicList = cache(async (publicId: string) => {
  return getPublicList(publicId);
});
