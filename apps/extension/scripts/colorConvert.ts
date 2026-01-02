#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import chroma from "chroma-js";

type ColorFormat = "oklch" | "hsl" | "rgb" | "hex" | "lch" | "lab" | "oklab";

const SUPPORTED_FORMATS: ColorFormat[] = ["oklch", "hsl", "rgb", "hex", "lch", "lab", "oklab"];

// Regex to match color values in CSS (hex with optional alpha, rgb, hsl, etc.)
const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_COLOR_REGEX =
  /rgba?\(\s*[\d.]+%?\s*,?\s*[\d.]+%?\s*,?\s*[\d.]+%?\s*(?:[,/]\s*[\d.]+%?)?\s*\)/gi;
const HSL_COLOR_REGEX =
  /hsla?\(\s*[\d.]+(?:deg)?\s*,?\s*[\d.]+%?\s*,?\s*[\d.]+%?\s*(?:[,/]\s*[\d.]+%?)?\s*\)/gi;
const OKLCH_COLOR_REGEX = /oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.]+%?)?\s*\)/gi;

function parseArgs(): { inputFile: string; outputFormat: ColorFormat; outputFile?: string } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Color Convert CLI - Convert CSS color variables to different formats

Usage:
  npx tsx colorConvert.ts <input.css> [options]

Options:
  -f, --format <format>   Output color format (default: oklch)
                          Supported: ${SUPPORTED_FORMATS.join(", ")}
  -o, --output <file>     Output file path (default: stdout)
  -h, --help              Show this help message

Examples:
  npx tsx colorConvert.ts input.css -f oklch
  npx tsx colorConvert.ts input.css -f hsl -o output.css
  npx tsx colorConvert.ts input.css --format rgb > output.css
`);
    process.exit(0);
  }

  let inputFile = "";
  let outputFormat: ColorFormat = "oklch";
  let outputFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === "-f" || arg === "--format") {
      const formatArg = args[++i];
      if (!formatArg) {
        console.error("Error: Missing format value");
        process.exit(1);
      }
      const format = formatArg.toLowerCase() as ColorFormat;
      if (!SUPPORTED_FORMATS.includes(format)) {
        console.error(
          `Error: Unsupported format "${format}". Supported: ${SUPPORTED_FORMATS.join(", ")}`,
        );
        process.exit(1);
      }
      outputFormat = format;
    } else if (arg === "-o" || arg === "--output") {
      outputFile = args[++i];
      if (!outputFile) {
        console.error("Error: Missing output file path");
        process.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      inputFile = arg;
    }
  }

  if (!inputFile) {
    console.error("Error: No input file specified");
    process.exit(1);
  }

  return { inputFile, outputFormat, outputFile };
}

function formatColor(color: chroma.Color, format: ColorFormat): string {
  const alpha = color.alpha();
  const hasAlpha = alpha < 1;

  switch (format) {
    case "oklch": {
      const [l, c, h] = color.oklch();
      const lightness = (l * 100).toFixed(2);
      const chromaVal = c.toFixed(4);
      const hue = isNaN(h) ? 0 : h.toFixed(2);
      if (hasAlpha) {
        return `oklch(${lightness}% ${chromaVal} ${hue} / ${alpha.toFixed(2)})`;
      }
      return `oklch(${lightness}% ${chromaVal} ${hue})`;
    }

    case "oklab": {
      const [l, a, b] = color.oklab();
      const lightness = (l * 100).toFixed(2);
      const aVal = a.toFixed(4);
      const bVal = b.toFixed(4);
      if (hasAlpha) {
        return `oklab(${lightness}% ${aVal} ${bVal} / ${alpha.toFixed(2)})`;
      }
      return `oklab(${lightness}% ${aVal} ${bVal})`;
    }

    case "lch": {
      const [l, c, h] = color.lch();
      const lightness = l.toFixed(2);
      const chromaVal = c.toFixed(2);
      const hue = isNaN(h) ? 0 : h.toFixed(2);
      if (hasAlpha) {
        return `lch(${lightness}% ${chromaVal} ${hue} / ${alpha.toFixed(2)})`;
      }
      return `lch(${lightness}% ${chromaVal} ${hue})`;
    }

    case "lab": {
      const [l, a, b] = color.lab();
      const lightness = l.toFixed(2);
      const aVal = a.toFixed(2);
      const bVal = b.toFixed(2);
      if (hasAlpha) {
        return `lab(${lightness}% ${aVal} ${bVal} / ${alpha.toFixed(2)})`;
      }
      return `lab(${lightness}% ${aVal} ${bVal})`;
    }

    case "hsl": {
      const [h, s, l] = color.hsl();
      const hue = isNaN(h) ? 0 : Math.round(h);
      const sat = Math.round(s * 100);
      const light = Math.round(l * 100);
      if (hasAlpha) {
        return `hsla(${hue}, ${sat}%, ${light}%, ${alpha.toFixed(2)})`;
      }
      return `hsl(${hue}, ${sat}%, ${light}%)`;
    }

    case "rgb": {
      const [r, g, b] = color.rgb();
      if (hasAlpha) {
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha.toFixed(2)})`;
      }
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    case "hex": {
      if (hasAlpha) {
        return color.hex("rgba");
      }
      return color.hex("rgb");
    }

    default:
      return color.hex();
  }
}

function convertColors(css: string, format: ColorFormat): string {
  let result = css;

  // Replace hex colors
  result = result.replace(HEX_COLOR_REGEX, (match) => {
    try {
      const color = chroma(match);
      return formatColor(color, format);
    } catch {
      console.warn(`Warning: Could not parse color "${match}"`);
      return match;
    }
  });

  // Replace rgb/rgba colors
  result = result.replace(RGB_COLOR_REGEX, (match) => {
    try {
      const color = chroma(match);
      return formatColor(color, format);
    } catch {
      console.warn(`Warning: Could not parse color "${match}"`);
      return match;
    }
  });

  // Replace hsl/hsla colors
  result = result.replace(HSL_COLOR_REGEX, (match) => {
    try {
      const color = chroma(match);
      return formatColor(color, format);
    } catch {
      console.warn(`Warning: Could not parse color "${match}"`);
      return match;
    }
  });

  // Replace oklch colors (if converting away from oklch)
  if (format !== "oklch") {
    result = result.replace(OKLCH_COLOR_REGEX, (match) => {
      try {
        // Parse oklch manually since chroma doesn't support it directly
        const oklchMatch = match.match(
          /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%?)?\s*\)/i,
        );
        if (oklchMatch) {
          const [, l, c, h, a] = oklchMatch;
          if (!l || !c || !h) return match;
          const lightness = parseFloat(l) / 100;
          const chromaVal = parseFloat(c);
          const hue = parseFloat(h);
          const alpha = a ? parseFloat(a) : 1;

          // Convert oklch to rgb via chroma's oklab support
          // oklch(L, C, H) -> oklab(L, C*cos(H), C*sin(H))
          const hRad = (hue * Math.PI) / 180;
          const aLab = chromaVal * Math.cos(hRad);
          const bLab = chromaVal * Math.sin(hRad);

          const color = chroma.oklab(lightness, aLab, bLab).alpha(alpha);
          return formatColor(color, format);
        }
        return match;
      } catch {
        console.warn(`Warning: Could not parse color "${match}"`);
        return match;
      }
    });
  }

  return result;
}

function main() {
  const { inputFile, outputFormat, outputFile } = parseArgs();

  // Resolve input file path
  const resolvedInputPath = path.resolve(inputFile);

  if (!fs.existsSync(resolvedInputPath)) {
    console.error(`Error: Input file not found: ${resolvedInputPath}`);
    process.exit(1);
  }

  // Read input file
  const inputCss = fs.readFileSync(resolvedInputPath, "utf-8");

  // Convert colors
  const outputCss = convertColors(inputCss, outputFormat);

  // Output result
  if (outputFile) {
    const resolvedOutputPath = path.resolve(outputFile);
    fs.writeFileSync(resolvedOutputPath, outputCss, "utf-8");
    console.log(`✓ Converted colors to ${outputFormat} format`);
    console.log(`  Output: ${resolvedOutputPath}`);
  } else {
    console.log(outputCss);
  }
}

main();
