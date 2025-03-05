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

type Palette = Record<string, PaletteEntry>;

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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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

  return [r * 255, g * 255, b * 255];
}

function adjustLightness(h: number, s: number, l: number, targetLuminance = 50): number {
  const [r, g, b] = hslToRgb(h, s, l);

  const Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  if (Y === 0) return l;

  const correctionFactor = Math.log1p(targetLuminance) / Math.log1p(Y * 100);
  const newL = l * correctionFactor;

  return Math.max(0, Math.min(100, newL));
}

function adjustSaturation(h: number, s: number): number {
  let factor = 1;

  if (h >= 50 && h <= 150) {
    const t = (h - 70) / 80;
    factor = 1 - 0.2 * Math.sin(Math.PI * t);
  } else if (h > 150 && h <= 240) {
    const t = (h - 150) / 90;
    factor = 1 + 0.2 * Math.sin((Math.PI / 2) * t);
  }
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

  if (entry.luminance !== undefined) {
    saturation = adjustSaturation(hue, saturation);
    lightness = adjustLightness(hue, saturation, lightness, Number(entry.luminance));
  }

  if (entry.min_l && lightness < Number(entry.min_l)) {
    lightness = Number(entry.min_l);
  }
  if (entry.max_l && lightness > Number(entry.max_l)) {
    lightness = Number(entry.max_l);
  }

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
      if (entry.link && generatedHsl[entry.link]) {
        generatedHsl[key] = generateColor(generatedHsl[entry.link]!, entry);
      } else {
        generatedHsl[key] = generateColor(baseHsl, entry);
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
  const dark = generateColors(DarkPalette, Hsl, "-dark");
  const light = generateColors(LightPalette, Hsl, "-light");

  return { ...dark, ...light };
}

export function setCss(colors: ReturnType<typeof generateAll>) {
  for (const key in colors) {
    document.documentElement.style.setProperty(`--${key}`, colors[key]!);
  }
}
