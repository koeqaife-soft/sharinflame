import DefaultLightPalette from "src/assets/themes/default-light.json";
import DefaultDarkPalette from "src/assets/themes/default-dark.json";
import MonochromeLightPalette from "src/assets/themes/monochrome-light.json";
import MonochromeDarkPalette from "src/assets/themes/monochrome-dark.json";
import ContrastDarkPalette from "src/assets/themes/contrast-dark.json";
import ContrastLightPalette from "src/assets/themes/contrast-light.json";
import { LRUCache } from "./cache";

const convertCacheHex = new LRUCache<string, string>(512);
const convertCacheRgb = new LRUCache<string, Rgb>(512);
const hueStepsCache = new Map<string, string[]>();

type HslAction = [action: string, value: string];
type Hsl = [h: number, s: number, l: number];
type Rgb = [r: number, g: number, b: number];

export interface PaletteEntry {
  h?: HslAction;
  s?: HslAction;
  l?: HslAction;
  min_l?: string;
  max_l?: string;
  hex?: string;
  link?: string;
  luminance?: string;
  flags?: string[];
}

export type Palette = Record<string, PaletteEntry>;

export const palettes = {
  default: {
    light: DefaultLightPalette as unknown as Palette,
    dark: DefaultDarkPalette as unknown as Palette
  },
  monochrome: {
    light: MonochromeLightPalette as unknown as Palette,
    dark: MonochromeDarkPalette as unknown as Palette
  },
  contrast: {
    light: ContrastLightPalette as unknown as Palette,
    dark: ContrastDarkPalette as unknown as Palette
  }
} as const;

function hslToHex(h: number, s: number, l: number): string {
  const key = `${h.toFixed(2)},${s.toFixed(2)},${l.toFixed(2)}`;
  if (convertCacheHex.has(key)) return convertCacheHex.get(key)!;

  const rgb = hslToRgb(h, s, l);
  const result = `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
  convertCacheHex.put(key, result);

  return result;
}

function adjustValue(value: number, delta: number): number {
  const result = value + delta;
  return Math.max(0, Math.min(100, result));
}

function adjustHue(hue: number, delta: number): number {
  return (hue + delta + 360) % 360;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const key = `${h.toFixed(2)},${s.toFixed(2)},${l.toFixed(2)}`;
  if (convertCacheRgb.has(key)) return convertCacheRgb.get(key)!;
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const result = [r * 255, g * 255, b * 255] as Rgb;
  convertCacheRgb.put(key, result);

  return result;
}

function adjustLightness(h: number, s: number, l: number, targetLuminance = 50): number {
  const [r, g, b] = hslToRgb(h, s, l);

  const Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  if (Y === 0) return l;

  const correctionFactor = targetLuminance / (Y * 100);
  const newL = l * correctionFactor;

  return Math.max(0, Math.min(100, newL));
}

function hueSaturationCorrection(hue: number): number {
  const h = ((hue % 360) + 360) % 360;

  const points: [number, number][] = [
    [0, 1],
    [40, 0.6],
    [90, 0.7],
    [180, 0.5],
    [250, 0.7],
    [320, 0.85],
    [360, 1]
  ] as const;

  for (let i = 0; i < points.length - 1; i++) {
    const [h1, f1] = points[i]!;
    const [h2, f2] = points[i + 1]!;

    if (h >= h1 && h <= h2) {
      const t = (h - h1) / (h2 - h1);
      return f1 + (f2 - f1) * t;
    }
  }

  return 1;
}

function adjustSaturation(h: number, s: number): number {
  const factor = hueSaturationCorrection(h);
  const newS = s * factor;
  return newS > 100 ? 100 : newS;
}

function generateColor(hsl: Hsl, entry: PaletteEntry): Hsl {
  let [hue, saturation, lightness] = hsl;

  const applyValue = (from: number, hslAction: HslAction, func: typeof adjustValue | typeof adjustHue) => {
    const [action, value] = hslAction;
    const delta = parseFloat(value);

    if (action === "=") return delta;
    return func(from, action === "+" ? delta : -delta);
  };

  if (entry.h) hue = applyValue(hue, entry.h, adjustHue);
  if (entry.s) saturation = applyValue(saturation, entry.s, adjustValue);
  if (entry.l) lightness = applyValue(lightness, entry.l, adjustValue);
  if (!entry.flags?.includes("no-adjust")) saturation = adjustSaturation(hue, saturation);

  if (entry.luminance !== undefined) lightness = adjustLightness(hue, saturation, lightness, Number(entry.luminance));

  const minL = entry.min_l ? Number(entry.min_l) : 0;
  const maxL = entry.max_l ? Number(entry.max_l) : 100;

  if (entry.min_l && lightness < minL) lightness = minL;
  if (entry.max_l && lightness > maxL) lightness = maxL;

  return [hue, saturation, lightness];
}

export function generateColors(palette: Palette, baseHsl: Hsl, suffix: string = "") {
  const generatedHsl: { [key: string]: Hsl } = {};
  const generated: { [key: string]: string } = {};

  for (const key in palette) {
    const entry = palette[key]!;
    if (entry.hex) {
      generated[key] = entry.hex;
    } else if (entry.link && generated[entry.link]) {
      generated[key] = generated[entry.link]!;
    } else {
      if (entry.link && generatedHsl[entry.link]) generatedHsl[key] = generateColor(generatedHsl[entry.link]!, entry);
      else generatedHsl[key] = generateColor(baseHsl, entry);
    }
  }

  for (const key in generatedHsl) {
    const hsl = generatedHsl[key]!;
    generated[key] = hslToHex(hsl[0], hsl[1], hsl[2]);
  }

  const output = Object.fromEntries(Object.entries(generated).map(([key, value]) => [`${key}${suffix}`, value]));

  return output;
}

export function generateOneColor(
  hsl: Hsl,
  colorKey: string,
  darkPalette: boolean = true,
  paletteKey: keyof typeof palettes = "default"
) {
  const palette: Palette = darkPalette ? palettes[paletteKey].dark : palettes[paletteKey].light;
  const entry = palette[colorKey];

  if (!entry) return "";
  if (entry.hex) return entry.hex;
  if (entry.link) throw new Error("Can be used only colors without links (for optimization)");

  const color = generateColor([hsl[0], hsl[1], hsl[2]], entry);
  return hslToHex(color[0], color[1], color[2]);
}

export function generateHueSteps(
  hsl: Hsl,
  colorKey: string,
  precision: number = 1,
  darkPalette: boolean = true,
  paletteKey: keyof typeof palettes = "default"
) {
  const cacheKey = `${colorKey}-${hsl[1]}-${hsl[2]}-${precision}-${darkPalette}`;
  if (hueStepsCache.has(cacheKey)) return hueStepsCache.get(cacheKey)!;

  const palette: Palette = darkPalette ? palettes[paletteKey].dark : palettes[paletteKey].light;
  const result: string[] = [];
  const entry = palette[colorKey];

  if (!entry) return [];
  if (entry.hex) return [entry.hex];
  // Adding link support is just can take a lot of time and I'm not going to use it
  if (entry.link) throw new Error("Can be used only colors without links (for optimization)");

  for (let i = 0; i <= 360; i += precision) {
    const color = generateColor([i, hsl[1], hsl[2]], entry);
    result.push(hslToHex(color[0], color[1], color[2]));
  }

  hueStepsCache.set(cacheKey, result);
  return result;
}

export function generateAll(Hsl: Hsl, paletteKey: keyof typeof palettes = "default") {
  const dark = generateColors(palettes[paletteKey].dark, Hsl);
  const light = generateColors(palettes[paletteKey].light, Hsl);

  return { dark: dark, light: light };
}

export function setCss(colors: Record<string, string>) {
  for (const key in colors) {
    if (key.startsWith("$")) continue;
    document.documentElement.style.setProperty(`--${key}`, colors[key]!);
  }
}
