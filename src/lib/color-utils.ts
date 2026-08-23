type Hsl = { h: number; s: number; l: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHue(h: number): number {
  const mod = h % 360;
  return mod < 0 ? mod + 360 : mod;
}

export function hslToTriplet(hsl: Hsl): string {
  const h = Math.round(normalizeHue(hsl.h));
  const s = Math.round(clamp(hsl.s, 0, 100));
  const l = Math.round(clamp(hsl.l, 0, 100));
  return `${h} ${s}% ${l}%`;
}

export function hslToCss(hsl: Hsl): string {
  const h = Math.round(normalizeHue(hsl.h));
  const s = Math.round(clamp(hsl.s, 0, 100));
  const l = Math.round(clamp(hsl.l, 0, 100));
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function parseHslString(input: string): Hsl | null {
  const match = input.match(/hsl\(\s*([-\d.]+)\s*,\s*([-\d.]+)%\s*,\s*([-\d.]+)%\s*\)/i);
  if (!match) return null;
  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

function parseHexString(input: string): Hsl | null {
  const hex = input.replace('#', '').trim();
  if (![3, 6].includes(hex.length)) return null;

  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : hex;

  const int = Number.parseInt(fullHex, 16);
  if (Number.isNaN(int)) return null;

  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: normalizeHue(h),
    s: s * 100,
    l: l * 100,
  };
}

export function colorToHsl(input: string): Hsl | null {
  return parseHslString(input) || parseHexString(input);
}

