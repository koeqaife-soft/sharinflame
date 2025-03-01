import LightPaletteJson from "src/assets/colors-light.json";
import DarkPaletteJson from "src/assets/colors-dark.json";

type HslAction = [action: string, value: string];
type Hsl = [h: number, s: number, l: number];

interface PaletteEntry {
  h?: HslAction;
  s?: HslAction;
  l?: HslAction;
  min_l?: string;
  max_l?: string;
  hex?: string;
  link?: string;
  luminance?: string;
}

interface Palette {
  [key: string]: PaletteEntry;
}

export const LightPalette = LightPaletteJson as unknown as Palette;
export const DarkPalette = DarkPaletteJson as unknown as Palette;

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color);
  };

  return `#${f(0).toString(16).padStart(2, "0")}${f(8).toString(16).padStart(2, "0")}${f(4)
    .toString(16)
    .padStart(2, "0")}`;
}

function adjustValue(value: number, delta: number): number {
  const result = value + delta;
  return Math.max(0, Math.min(100, result));
}

function adjustHue(hue: number, delta: number): number {
  return (hue + delta) % 360;
}

function calculatePerceptualLightness(h: number, s: number, l: number): number {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const a = s * Math.min(l, 1 - l);

  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };

  const r = f(0);
  const g = f(8);
  const b = f(4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function findLightnessForLuminance(hue: number, saturation: number, targetLuminance: number): number {
  let low = 0,
    high = 100,
    mid = 50;

  for (let i = 0; i < 10; i++) {
    const luminance = calculatePerceptualLightness(hue, saturation, mid);
    if (Math.abs(luminance - targetLuminance) < 0.001) return mid;
    if (luminance < targetLuminance) low = mid;
    else high = mid;
    mid = low + (high - low) / 2;
  }

  return mid;
}

function beautifyColor(h: number, s: number, l: number, isDarkMode: boolean): Hsl {
  if (isDarkMode) {
    if (l > 80) {
      l = Math.floor(80 + (l - 80) * 0.2);
    }

    if (h >= 180 && h <= 260) {
      s *= Math.floor(Math.pow(1.05, Math.abs(h - 180) / 10));
    }
  }

  return [h, s, l];
}

function generateColor(hsl: Hsl, entry: PaletteEntry, isDarkMode: boolean): Hsl {
  let [hue, saturation, lightness] = hsl;

  const applyValue = (from: number, hslAction: HslAction, func: typeof adjustValue | typeof adjustHue) => {
    const [action, value] = hslAction;
    const delta = parseFloat(value);

    if (action === "=") return delta;
    return func(from, action === "+" ? delta : -delta);
  };

  if (entry.h) hue = applyValue(hue, entry.h, adjustHue);
  if (entry.s) saturation = applyValue(saturation, entry.s, adjustValue);

  if (entry.luminance !== undefined) {
    lightness = findLightnessForLuminance(hue, saturation, parseFloat(entry.luminance));
  } else if (entry.l) {
    lightness = applyValue(lightness, entry.l, adjustValue);
  }

  if (entry.min_l && lightness < Number(entry.min_l)) {
    lightness = Number(entry.min_l);
  }
  if (entry.max_l && lightness > Number(entry.max_l)) {
    lightness = Number(entry.max_l);
  }

  return beautifyColor(hue, saturation, lightness, isDarkMode);
}

export function generateColors(palette: Palette, baseHsl: Hsl, suffix: string = "", isDarkMode: boolean) {
  const generatedHsl: { [key: string]: Hsl } = {};
  const generated: { [key: string]: string } = {};

  for (const key in palette) {
    const entry = palette[key]!;
    if (entry.hex) {
      generated[key] = entry.hex;
    } else if (entry.link && generated[entry.link]) {
      generated[key] = generated[entry.link]!;
    } else {
      if (entry.link && generatedHsl[entry.link]) {
        generatedHsl[key] = generateColor(generatedHsl[entry.link]!, entry, isDarkMode);
      } else {
        generatedHsl[key] = generateColor(baseHsl, entry, isDarkMode);
      }
    }
  }

  for (const key in generatedHsl) {
    const hsl = generatedHsl[key]!;
    generated[key] = hslToHex(hsl[0], hsl[1], hsl[2]);
  }

  const output = Object.fromEntries(Object.entries(generated).map(([key, value]) => [`${key}${suffix}`, value]));

  return output;
}

export function generateAll(Hsl: Hsl) {
  const dark = generateColors(DarkPalette, Hsl, "-dark", true);
  const light = generateColors(LightPalette, Hsl, "-light", false);

  return { ...dark, ...light };
}

export function setCss(colors: ReturnType<typeof generateAll>) {
  for (const key in colors) {
    document.documentElement.style.setProperty(`--${key}`, colors[key]!);
  }
}
