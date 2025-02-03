import chroma from "chroma-js";
import { useEffect } from "react";
import { Pane } from "tweakpane";

const colorVariables = [
  "--background-base",
  "--background",
  "--foreground",
  "--card",
  "--card-active",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--border-active",
  "--input",
  "--ring",
  "--surface-1",
  "--surface-2",
  "--surface-3",
  "--surface-4",
];

const round2 = (num: number) => Math.round(num * 100) / 100;

const hslToHex = (h: number, s: number, l: number) => chroma(h, s / 100, l / 100, "hsl").hex();
const chromaFromHsl = (color: string) => {
  const [h, s, l] = color.replaceAll("%", "").split(" ").map(Number);

  return chroma(h, s / 100, l / 100, "hsl");
};

const initTweakpane = () => {
  const style = window.getComputedStyle(document.documentElement);

  const initialValues = Object.fromEntries(
    colorVariables.map((v) => {
      const color = style.getPropertyValue(v);

      return [v, color];
    }),
  );

  let params = Object.fromEntries(
    colorVariables.map((v) => {
      const color = style.getPropertyValue(v);
      const [h, s, l] = color.replaceAll("%", "").split(" ").map(Number);
      const [r, g, b] = chroma(h, s / 100, l / 100, "hsl").rgb();

      return [v, { r, g, b }];
    }),
  );

  const pane = new Pane({ expanded: false, title: "Colors" });

  for (const v of colorVariables) {
    pane
      .addBinding(params, v, {
        label: v.slice(2),
        picker: "inline",
        expanded: false,
      })
      .on("change", (e) => {
        const { r, g, b } = e.value;
        const [h, s, l] = chroma(r, g, b, "rgb").hsl();

        document.documentElement.style.setProperty(
          v,
          `${round2(h || 0)} ${round2(s * 100)}% ${round2(l * 100)}%`,
        );
      });
  }

  const initState = JSON.parse(JSON.stringify(pane.exportState()));

  pane.addButton({ title: "Reset Colors" }).on("click", () => {
    for (const v of colorVariables) {
      document.documentElement.style.setProperty(v, initialValues[v]);
    }

    pane.importState(initState);
  });

  pane.addButton({ title: "Export Colors" }).on("click", () => {
    const css = `:root {\n${colorVariables
      .flatMap((v) => {
        if (!window.getComputedStyle(document.documentElement).getPropertyValue(v)) {
          return [];
        }
        const chroma = chromaFromHsl(
          window.getComputedStyle(document.documentElement).getPropertyValue(v),
        );
        return [`${v}: ${chroma.hex()};`];
      })
      .join("\n")}\n}`;

    const w3cJson = Object.fromEntries(
      colorVariables.map((v) => {
        const chroma = chromaFromHsl(
          window.getComputedStyle(document.documentElement).getPropertyValue(v),
        );
        return [v.slice(2), { $value: chroma.hex(), $type: "color" }];
      }),
    );

    const blob = new Blob([JSON.stringify(w3cJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const name = "echotab-colors.json";

    a.href = url;
    a.download = name;
    a.click();

    // w3c color token format
    // {
    //   "token name": {
    //     "$value": "#fff000",
    //     "$type": "color"
    //   }
    // }

    // const blob = new Blob([css], { type: "text/css" });
    // const url = URL.createObjectURL(blob);

    // const a = document.createElement("a");
    // const name = "echotab-colors.css";

    // a.href = url;
    // a.download = name;
    // a.click();
  });

  return pane;
};

export default function ColorTweakpane() {
  useEffect(() => {
    // const pane = initTweakpane();

    return () => {
      // pane.dispose();
    };
  }, []);

  return null;
}
