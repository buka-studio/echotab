export function getParentEl(el: Element | null, selector: string): HTMLElement | null {
  if (!el) return null;
  if (el.matches(selector)) return el as HTMLElement;
  return getParentEl(el.parentElement, selector);
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
