export const normalizedComparator = (a = "", b = "") => {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: "base", usage: "search" });
};

export const isAlphanumeric = (key: string) => /^[a-zA-Z0-9]$/.test(key);
