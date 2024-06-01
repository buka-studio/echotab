import { ClipboardFormat } from "../UIStore";

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

export function isValidActiveTab(tab?: Partial<chrome.tabs.Tab>) {
    return tab && tab.url && tab.id && tab.title;
}

export function capitalize(s: string) {
    return s[0].toUpperCase() + s.slice(1);
}

const UTMParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const FacebookParams = ["fbclid"];
const miscTrackingParams = [
    "origin",
    "ocid",
    "amp",
    "trackingId",
    "ref",
    "ref_source",
    "ref_src",
    "ref_url",
    "_amp",
];

const trackingParamSet = new Set([...UTMParams, ...FacebookParams, ...miscTrackingParams]);

export function stripTrackingParams(url: string): string {
    const u = new URL(url);
    for (const p of trackingParamSet) {
        u.searchParams.delete(p);
    }

    return u.toString();
}

export function canonicalizeURL(
    url: string,
    config: {
        stripTracking?: boolean;
    } = {
        stripTracking: true,
    },
) {
    let canonical = url;
    if (config.stripTracking) {
        canonical = stripTrackingParams(url);
    }

    return canonical;
}

export function getParentEl(el: Element | null, selector: string): HTMLElement | null {
    if (!el) return null;
    if (el.matches(selector)) return el as HTMLElement;
    return getParentEl(el.parentElement, selector);
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
            return JSON.stringify(links);
        case ClipboardFormat.HTML:
            return links
                .map((l) => `<a href="${l.url}" data-tags="${hashTags(l.tags)}">${l.title}</a>`)
                .join("\n");
    }
}

export function focusSiblingItem(e: React.KeyboardEvent, selector: string) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const currentItem = document.activeElement;

        const parent = getParentEl(currentItem, selector);
        if (parent) {
            e.preventDefault();
            e.stopPropagation();

            const items = document.querySelectorAll(selector);
            const i = Array.from(items).indexOf(parent);

            let newIndex = i;

            if (e.key === "ArrowUp") {
                newIndex = i > 0 ? i - 1 : items.length - 1;
            } else if (e.key === "ArrowDown") {
                newIndex = i < items.length - 1 ? i + 1 : 0;
            }

            if (items[newIndex]) {
                const focusable = items[newIndex].querySelector("a,button");
                if (focusable) {
                    (focusable as HTMLElement).focus();
                }
            }
        }
    }
}

export function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
