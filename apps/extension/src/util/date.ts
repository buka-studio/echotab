import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export function formatDate(iso: string | Date, template = "ddd D MMM, YYYY"): string {
  return dayjs(iso).format(template);
}

export function getUtcISO() {
  return dayjs.utc().format();
}
