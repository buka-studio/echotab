export function getWidgetRoot() {
  return document
    .querySelector("echotab-widget")
    ?.shadowRoot?.querySelector(".echotab-root") as HTMLElement;
}
