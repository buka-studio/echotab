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

const round3 = (num: number) => Math.round(num * 1000) / 1000;

const formatOklch = (l: number, c: number, h: number): string => {
  return `oklch(${round3(l * 100)}% ${round3(c)} ${round3(h)})`;
};

const initTweakpane = () => {
  const root = document.querySelector(".echotab-root") ?? document.documentElement;
  const style = window.getComputedStyle(root);

  const initialValues = Object.fromEntries(
    colorVariables.map((v) => {
      const color = style.getPropertyValue(v).trim();
      return [v, color];
    }),
  );

  const params = Object.fromEntries(
    colorVariables.map((v) => {
      const color = style.getPropertyValue(v).trim();
      if (!color) {
        return [v, { r: 128, g: 128, b: 128 }];
      }
      const [r, g, b] = chroma(color).rgb();

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
        const [l, c, h] = chroma(r, g, b, "rgb").oklch();

        (root as HTMLElement).style.setProperty(v, formatOklch(l, c, h || 0));
      });
  }

  const initState = JSON.parse(JSON.stringify(pane.exportState()));

  pane.addButton({ title: "Reset Colors" }).on("click", () => {
    for (const v of colorVariables) {
      (root as HTMLElement).style.setProperty(v, initialValues[v] ?? null);
    }

    pane.importState(initState);
  });

  pane.addButton({ title: "Export Colors" }).on("click", () => {
    const w3cJson = Object.fromEntries(
      colorVariables.flatMap((v) => {
        const rawColor = window.getComputedStyle(root).getPropertyValue(v).trim();
        if (!rawColor) {
          return [];
        }
        return [[v.slice(2), { $value: chroma(rawColor).hex(), $type: "color" }]];
      }),
    );

    const blob = new Blob([JSON.stringify(w3cJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const name = "echotab-colors.json";

    a.href = url;
    a.download = name;
    a.click();
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
