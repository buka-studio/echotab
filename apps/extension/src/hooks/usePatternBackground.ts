import { useUIStore } from "../UIStore";
import { URLEncodeSVG } from "../util";

export type PatternType = "diagonal_lines" | "dots";

export default function usePatternBackground(type: PatternType) {
  useUIStore();

  const isDarkTheme = document.documentElement.classList.contains("dark");
  const fillColor = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--muted-foreground");

  let pattern;
  if (type === "diagonal_lines") {
    pattern =
      "data:image/svg+xml," +
      URLEncodeSVG(`<svg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'>
              <g fill='hsl(${fillColor})' fill-opacity=${isDarkTheme ? "'0.15'" : "'0.25'"} fill-rule='evenodd'>
                  <path d='M5 0h1L0 6V5zM6 5v1H5z' />
              </g>
          </svg>`);
  } else if (type === "dots") {
    pattern =
      "data:image/svg+xml," +
      URLEncodeSVG(`<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'>
        <path fill='hsl(${fillColor})' fill-opacity=${isDarkTheme ? "'0.25'" : "'0.35'"} d='M1 3h1v1H1V3zm2-2h1v1H3V1z'></path>
      </svg>`);
  }

  return `url("${pattern}")`;
}
