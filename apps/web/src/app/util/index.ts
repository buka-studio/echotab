import dayjs from "dayjs";

export function formatDate(iso: string | Date, template = "MMM D, YYYY"): string {
  return dayjs(iso).format(template);
}

export function pluralize(count: number, singular: string, suffix = "s") {
  return `${count} ${singular}${count !== 1 ? suffix : ""}`;
}
