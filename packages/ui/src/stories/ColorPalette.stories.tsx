import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useRef, useEffect } from "react";

// Color definitions matching the theme
const colorGroups = {
  "Base": [
    { name: "background-base", variable: "--background-base" },
    { name: "background", variable: "--background" },
    { name: "foreground", variable: "--foreground" },
  ],
  "Card": [
    { name: "card", variable: "--card" },
    { name: "card-active", variable: "--card-active" },
    { name: "card-foreground", variable: "--card-foreground" },
  ],
  "Popover": [
    { name: "popover", variable: "--popover" },
    { name: "popover-foreground", variable: "--popover-foreground" },
  ],
  "Primary": [
    { name: "primary", variable: "--primary" },
    { name: "primary-foreground", variable: "--primary-foreground" },
  ],
  "Secondary": [
    { name: "secondary", variable: "--secondary" },
    { name: "secondary-foreground", variable: "--secondary-foreground" },
  ],
  "Muted": [
    { name: "muted", variable: "--muted" },
    { name: "muted-foreground", variable: "--muted-foreground" },
  ],
  "Accent": [
    { name: "accent", variable: "--accent" },
    { name: "accent-foreground", variable: "--accent-foreground" },
  ],
  "Border & Input": [
    { name: "border", variable: "--border" },
    { name: "border-active", variable: "--border-active" },
    { name: "input", variable: "--input" },
    { name: "ring", variable: "--ring" },
  ],
  "Surfaces": [
    { name: "surface-1", variable: "--surface-1" },
    { name: "surface-2", variable: "--surface-2" },
    { name: "surface-3", variable: "--surface-3" },
    { name: "surface-4", variable: "--surface-4" },
  ],
  "Destructive": [
    { name: "destructive", variable: "--destructive" },
    { name: "destructive-background", variable: "--destructive-background" },
    { name: "destructive-foreground", variable: "--destructive-foreground" },
    { name: "destructive-separator", variable: "--destructive-separator" },
  ],
  "Success": [
    { name: "success", variable: "--success" },
    { name: "success-background", variable: "--success-background" },
    { name: "success-foreground", variable: "--success-foreground" },
    { name: "success-separator", variable: "--success-separator" },
  ],
  "Info": [
    { name: "info", variable: "--info" },
    { name: "info-background", variable: "--info-background" },
    { name: "info-foreground", variable: "--info-foreground" },
    { name: "info-separator", variable: "--info-separator" },
  ],
  "Warning": [
    { name: "warning", variable: "--warning" },
    { name: "warning-background", variable: "--warning-background" },
    { name: "warning-foreground", variable: "--warning-foreground" },
    { name: "warning-separator", variable: "--warning-separator" },
  ],
};

function oklchToHex(oklchString: string): string {
  // Create a temporary element to compute the color
  const temp = document.createElement("div");
  temp.style.color = oklchString;
  document.body.appendChild(temp);
  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);

  // Parse rgb/rgba values
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`.toUpperCase();
  }
  return oklchString;
}

function ColorSwatch({ name, variable }: { name: string; variable: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [computedColor, setComputedColor] = useState("");
  const [hexColor, setHexColor] = useState("");
  const swatchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (swatchRef.current) {
      const style = getComputedStyle(swatchRef.current);
      const bgColor = style.backgroundColor;
      setComputedColor(bgColor);
      
      // Get the CSS variable value
      const varValue = getComputedStyle(document.body).getPropertyValue(variable).trim();
      if (varValue) {
        setHexColor(oklchToHex(varValue));
      }
    }
  }, [variable]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  const cssVarUsage = `var(${variable})`;
  const tailwindClass = name;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={swatchRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-[100px] h-[100px] rounded-lg border border-border shadow-sm cursor-pointer hover:scale-105 transition-transform"
        style={{ backgroundColor: `var(${variable})` }}
        title={name}
      />
      <p className="mt-2 text-xs text-center text-muted-foreground truncate w-[100px]">{name}</p>
      
      {isOpen && (
        <div className="absolute top-[110px] left-1/2 -translate-x-1/2 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[180px]">
          <div className="text-xs font-medium mb-2 text-foreground">{name}</div>
          <div className="space-y-1">
            <button
              onClick={() => copyToClipboard(variable, "var")}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded flex justify-between items-center"
            >
              <span className="text-muted-foreground">CSS Variable</span>
              <span className="font-mono">{copied === "var" ? "Copied!" : variable}</span>
            </button>
            <button
              onClick={() => copyToClipboard(cssVarUsage, "usage")}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded flex justify-between items-center"
            >
              <span className="text-muted-foreground">Usage</span>
              <span className="font-mono">{copied === "usage" ? "Copied!" : `var(...)`}</span>
            </button>
            <button
              onClick={() => copyToClipboard(hexColor, "hex")}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded flex justify-between items-center"
            >
              <span className="text-muted-foreground">Hex</span>
              <span className="font-mono">{copied === "hex" ? "Copied!" : hexColor}</span>
            </button>
            <button
              onClick={() => copyToClipboard(tailwindClass, "tailwind")}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded flex justify-between items-center"
            >
              <span className="text-muted-foreground">Tailwind</span>
              <span className="font-mono">{copied === "tailwind" ? "Copied!" : `bg-${name}`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorPalette() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Color Palette</h1>
        <p className="text-muted-foreground">Click on any color to copy its value. Toggle theme in the toolbar to see dark mode colors.</p>
      </div>
      
      {Object.entries(colorGroups).map(([groupName, colors]) => (
        <div key={groupName}>
          <h2 className="text-lg font-semibold mb-4 text-foreground">{groupName}</h2>
          <div className="flex flex-wrap gap-4">
            {colors.map((color) => (
              <ColorSwatch key={color.name} name={color.name} variable={color.variable} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof ColorPalette> = {
  title: "Design System/Color Palette",
  component: ColorPalette,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
