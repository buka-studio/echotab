import { ClipboardFormat } from "../UIStore";

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function downloadJSON(obj: Record<string, unknown>, name: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(obj, undefined, 2)], {
      type: "json",
    }),
  );
  a.href = url;
  a.download = name;
  a.click();
}

export function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

export function pluralize(count: number, singular: string, suffix = "s") {
  return `${count} ${singular}${count !== 1 ? suffix : ""}`;
}

export function groupBy<T, K extends keyof T, V>(
  array: T[],
  getKey: (item: T) => K,
  getValue: (item: T) => V,
): Record<K, V[]> {
  const record: Record<K, V[]> = {} as Record<K, V[]>;
  for (const item of array) {
    const key = getKey(item);
    if (!record[key]) {
      record[key] = [];
    }
    record[key].push(getValue(item));
  }
  return record;
}

export function getFormattedLinksExample(format: ClipboardFormat, includeTags: boolean) {
  const links = Array.from({ length: 3 }).map((_, i) => ({
    title: `title-${i}`,
    url: `https://example.com/${i}`,
    tags: includeTags ? ["tag1", "tag2"] : [],
  }));

  return formatLinks(links, format);
}

const hashTags = (tags: string[] = []) => tags?.map((t) => `#${t}`)?.join(" ") || "";

export function formatLinks(
  links: { title: string; url: string; tags?: string[] }[],
  format: ClipboardFormat,
) {
  switch (format) {
    case ClipboardFormat.Text:
      return links.map((l) => `${l.url} ${l.title} ${hashTags(l.tags)}`).join("\n");
    case ClipboardFormat.Markdown:
      return links.map((l) => `[${l.title}](${l.url}) ${hashTags(l.tags)}`).join("\n\n");
    case ClipboardFormat.JSON:
      return JSON.stringify(links, undefined, 2);
    case ClipboardFormat.HTML:
      return links
        .map((l) => `<a href="${l.url}" data-tags="${hashTags(l.tags)}">${l.title}</a>`)
        .join("\n");
  }
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function replaceBy<T>(array: T[], item: T, predicate: (item: T) => boolean) {
  return array.map((i) => (predicate(i) ? item : i));
}

export function URLEncodeSVG(svg: string) {
  // src https://github.com/yoksel/url-encoder
  const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;

  // Use single quotes instead of double to avoid encoding.

  svg = svg.replace(/>\s{1,}</g, `><`);
  svg = svg.replace(/\s{2,}/g, ` `);

  // Using encodeURIComponent() as replacement function
  // allows to keep result code readable
  return svg.replace(symbols, encodeURIComponent);
}
