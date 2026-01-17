import { detailedDiff } from "deep-object-diff";

export type DetailedDiff = {
  added: Record<string, unknown>;
  deleted: Record<string, unknown>;
  updated: Record<string, unknown>;
};

export class LogFormatter {
  static value(val: unknown, depth = 0): string {
    if (depth > 2) return "...";
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return val.length > 50 ? `"${val.slice(0, 50)}..."` : `"${val}"`;
    if (Array.isArray(val))
      return `[${val
        .slice(0, 3)
        .map((v) => LogFormatter.value(v, depth + 1))
        .join(", ")}${val.length > 3 ? ", ..." : ""}]`;
    if (typeof val === "object") {
      const entries = Object.entries(val).slice(0, 3);
      const formatted = entries
        .map(([k, v]) => `${k}: ${LogFormatter.value(v, depth + 1)}`)
        .join(", ");
      return `{${formatted}${Object.keys(val).length > 3 ? ", ..." : ""}}`;
    }
    return String(val);
  }

  static diff(diff: DetailedDiff): string {
    const lines: string[] = [];

    const formatNested = (obj: Record<string, unknown>, prefix: string, symbol: string) => {
      for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val && typeof val === "object" && !Array.isArray(val)) {
          formatNested(val as Record<string, unknown>, path, symbol);
        } else {
          lines.push(`  ${symbol} ${path}: ${LogFormatter.value(val)}`);
        }
      }
    };

    formatNested(diff.added, "", "+");
    formatNested(diff.deleted, "", "-");
    formatNested(diff.updated, "", "~");

    return lines.length ? `\n${lines.join("\n")}` : "no changes";
  }

  static jsonDiff(oldStr: any | null, newStr: any): DetailedDiff | null {
    try {
      const oldObj = typeof oldStr === "string" ? JSON.parse(oldStr) : oldStr;
      const newObj = typeof newStr === "string" ? JSON.parse(newStr) : newStr;
      const diff = detailedDiff(oldObj, newObj) as DetailedDiff;

      const hasChanges =
        Object.keys(diff.added).length > 0 ||
        Object.keys(diff.deleted).length > 0 ||
        Object.keys(diff.updated).length > 0;

      return hasChanges ? diff : null;
    } catch {
      return null;
    }
  }
}
