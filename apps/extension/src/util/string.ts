export const normalizedComparator = (a = "", b = "") => {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: "base", usage: "search" });
};
