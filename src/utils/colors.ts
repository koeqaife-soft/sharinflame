import LightPaletteJson from "src/assets/colors-light.json";
import DarkPaletteJson from "src/assets/colors-dark.json";

type HslAction = [action: string, value: string];
type Hsl = [h: number, s: number, l: number];

interface PaletteEntry {
  h?: HslAction;
  s?: HslAction;
  l?: HslAction;
  hex?: string;
  link?: string;
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

function generateColor(hsl: Hsl, entry: PaletteEntry): Hsl {
  let [hue, saturation, lightness] = hsl;

  const applyValue = (from: number, hslAction: HslAction, func: typeof adjustValue | typeof adjustHue) => {
    const [action, value] = hslAction;
    const delta = parseFloat(value);

    let result = from;

    if (action === "+") result = func(from, delta);
    else if (action === "-") result = func(from, -delta);
    else if (action === "=") result = delta;

    return result;
  };

  if (entry.h) hue = applyValue(hue, entry.h, adjustHue);
  if (entry.s) saturation = applyValue(saturation, entry.s, adjustValue);
  if (entry.l) lightness = applyValue(lightness, entry.l, adjustValue);

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
