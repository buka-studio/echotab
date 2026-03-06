import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "lightningcss";

const rootFontSize = 16;

async function collectCssFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectCssFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".css")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function convertFile(filePath: string): Promise<void> {
  const css = await readFile(filePath);
  const { code } = transform({
    filename: filePath,
    code: css,
    minify: false,
    sourceMap: false,
    visitor: {
      Length(length) {
        if (length.unit !== "rem") {
          return;
        }

        if (length.value === 0) {
          return {
            ...length,
            unit: "px",
            value: 0,
          };
        }

        return {
          ...length,
          unit: "px",
          value: Number((length.value * rootFontSize).toFixed(4)),
        };
      },
    },
  });

  await writeFile(filePath, code);
}

async function main(): Promise<void> {
  const dir = process.argv[2];

  if (!dir) {
    throw new Error("Usage: npx tsx ./scripts/remToPxCss.ts <directory>");
  }

  const targetDir = path.resolve(process.cwd(), dir);
  const files = await collectCssFiles(targetDir);

  if (files.length === 0) {
    throw new Error(`No CSS files found under ${targetDir}`);
  }

  await Promise.all(files.map((filePath) => convertFile(filePath)));
  console.log(`Converted rem to px in ${files.length} CSS file${files.length === 1 ? "" : "s"} under ${targetDir}`);
}

void main().catch((error: unknown) => {
  console.error("Failed to convert rem units in CSS", error);
  process.exitCode = 1;
});
