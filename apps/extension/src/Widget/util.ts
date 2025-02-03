export function getWidgetRoot() {
  return document
    .querySelector("plasmo-csui")
    ?.shadowRoot?.querySelector(".echotab-root") as HTMLElement;
}
