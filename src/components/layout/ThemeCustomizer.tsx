import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Check, Image, Moon, Palette, Paintbrush, Pipette, Save, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/lib/theme-context';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { ColorPicker } from '@/components/settings/ColorPicker';
import { useToast } from '@/hooks/use-toast';
import { useRandomColor } from '@/lib/random-color-context';
import {
  type BackgroundStyle,
  type UiStyle,
  applyBackgroundAccentsToRoot,
  applyBackgroundStyleToRoot,
  applyUiStyleToRoot,
  getStoredBackgroundAccent2,
  getStoredBackgroundAccent3,
  getStoredBackgroundStyle,
  getStoredUiStyle,
  setStoredBackgroundAccent2,
  setStoredBackgroundAccent3,
  setStoredBackgroundStyle,
  setStoredUiStyle,
} from '@/lib/appearance';

type ThemePreset = {
  id: string;
  name: string;
  themeColor: string;
  backgroundColor: string;
  uiStyle: UiStyle;
  backgroundStyle: BackgroundStyle;
  backgroundColor2: string;
  backgroundColor3: string;
};

type PresetTone = 'light' | 'dark';

type EyeDropperResult = {
  sRGBHex: string;
};

declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<EyeDropperResult>;
    };
  }
}

const DEFAULT_THEME_COLOR = '#8b5cf6';
const DEFAULT_BACKGROUND_COLOR = '#0f172a';
const DEFAULT_BG_ACCENT_3 = '#38bdf8';

function getColorLuminance(hex: string) {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const value = Number.parseInt(expanded, 16);

  if (Number.isNaN(value)) return 0;

  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function getPresetTone(preset: ThemePreset): PresetTone {
  return getColorLuminance(preset.backgroundColor) > 0.56 ? 'light' : 'dark';
}

function getBackgroundPreview(style: BackgroundStyle, backgroundColor: string, themeColor: string, color2: string, color3: string) {
  if (style === 'plain') return 'none';
  if (style === 'diagonal') {
    return `linear-gradient(135deg, ${themeColor}55, transparent 42%), radial-gradient(circle at 80% 20%, ${color2}50, transparent 48%), radial-gradient(circle at 20% 90%, ${color3}42, transparent 48%)`;
  }
  if (style === 'aurora') {
    return `radial-gradient(circle at 12% 24%, ${color2}68, transparent 44%), radial-gradient(circle at 88% 22%, ${color3}58, transparent 48%), radial-gradient(circle at 45% 92%, ${themeColor}54, transparent 52%)`;
  }
  if (style === 'mesh') {
    return `radial-gradient(circle at 20% 30%, ${themeColor}6a, transparent 45%), radial-gradient(circle at 82% 28%, ${color2}5c, transparent 47%), radial-gradient(circle at 62% 82%, ${color3}52, transparent 48%)`;
  }
  if (style === 'noise') {
    return `radial-gradient(circle at 20% 25%, rgba(255,255,255,0.16), transparent 52%), repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 5px)`;
  }
  if (style === 'diamond') {
    return `radial-gradient(circle at 20% 25%, ${themeColor}54, transparent 46%), linear-gradient(135deg, transparent 0 42%, rgba(255,255,255,0.22) 43%, transparent 46%), linear-gradient(45deg, transparent 0 55%, ${color2}38 57%, transparent 61%)`;
  }
  if (style === 'pixel') {
    return `radial-gradient(circle at 20% 25%, ${themeColor}42, transparent 46%), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.14) 1px, transparent 1px)`;
  }
  if (style === 'neon') {
    return `radial-gradient(circle at 20% 25%, ${color2}56, transparent 46%), radial-gradient(circle at 82% 78%, ${themeColor}48, transparent 48%), linear-gradient(90deg, transparent 0 22%, rgba(125,211,252,0.28) 23%, transparent 25%)`;
  }
  return `radial-gradient(circle at 20% 25%, ${themeColor}52, transparent 46%), radial-gradient(circle at 84% 35%, ${color2}48, transparent 48%), radial-gradient(circle at 16px 16px, rgba(255,255,255,0.28) 2px, transparent 2.5px)`;
}

export function ThemeCustomizer() {
  const { setColorScheme, colorScheme } = useTheme();
  const { accentColor, setManualColor, resetToRandom, isRandom } = useRandomColor();
  const { preferences, loading, savePreferences } = useUserPreferences();
  const { toast } = useToast();

  const [themeColor, setThemeColor] = useState(preferences?.theme_color || DEFAULT_THEME_COLOR);
  const [backgroundColor, setBackgroundColor] = useState(preferences?.background_color || DEFAULT_BACKGROUND_COLOR);
  const [layoutStyle, setLayoutStyle] = useState(preferences?.layout_style || 'grid');
  const [presetId, setPresetId] = useState('custom');
  const [uiStyle, setUiStyle] = useState<UiStyle>(getStoredUiStyle());
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>(getStoredBackgroundStyle());
  const [backgroundColor2, setBackgroundColor2] = useState(getStoredBackgroundAccent2());
  const [backgroundColor3, setBackgroundColor3] = useState(getStoredBackgroundAccent3());
  const [presetTone, setPresetTone] = useState<PresetTone>(colorScheme === 'light' ? 'light' : 'dark');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const skipNextOpenSyncRef = useRef(false);

  const initialAppearanceRef = useRef<{
    uiStyle: UiStyle;
    backgroundStyle: BackgroundStyle;
    backgroundColor2: string;
    backgroundColor3: string;
  } | null>(null);

  const themePresets = useMemo<ThemePreset[]>(() => ([
    { id: 'tokyo-night', name: 'Tokyo Night', themeColor: '#7aa2f7', backgroundColor: '#101421', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#bb9af7', backgroundColor3: '#2ac3de' },
    { id: 'dracula', name: 'Dracula', themeColor: '#bd93f9', backgroundColor: '#282a36', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#ff79c6', backgroundColor3: '#50fa7b' },
    { id: 'nord-frost', name: 'Nord Frost', themeColor: '#88c0d0', backgroundColor: '#2e3440', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#81a1c1', backgroundColor3: '#a3be8c' },
    { id: 'gruvbox', name: 'Gruvbox', themeColor: '#fabd2f', backgroundColor: '#282828', uiStyle: 'soft', backgroundStyle: 'noise', backgroundColor2: '#b8bb26', backgroundColor3: '#fb4934' },
    { id: 'solarized', name: 'Solarized', themeColor: '#268bd2', backgroundColor: '#002b36', uiStyle: 'flat', backgroundStyle: 'diagonal', backgroundColor2: '#b58900', backgroundColor3: '#2aa198' },
    { id: 'monokai', name: 'Monokai', themeColor: '#a6e22e', backgroundColor: '#272822', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#fd971f', backgroundColor3: '#f92672' },
    { id: 'miami-synth', name: 'Miami Synth', themeColor: '#ff2bd6', backgroundColor: '#090019', uiStyle: 'neon', backgroundStyle: 'neon', backgroundColor2: '#00e5ff', backgroundColor3: '#ffe45e' },
    { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', themeColor: '#cba6f7', backgroundColor: '#1e1e2e', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#89b4fa', backgroundColor3: '#f5c2e7' },
    { id: 'rose-pine', name: 'Rose Pine', themeColor: '#ebbcba', backgroundColor: '#191724', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#31748f', backgroundColor3: '#f6c177' },
    { id: 'everforest', name: 'Everforest', themeColor: '#a7c080', backgroundColor: '#2d353b', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#7fbbb3', backgroundColor3: '#dbbc7f' },
    { id: 'ayu-mirage', name: 'Ayu Mirage', themeColor: '#ffb454', backgroundColor: '#10213a', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#39bae6', backgroundColor3: '#c792ea' },
    { id: 'pokeball-classic', name: 'Pokeball Classic', themeColor: '#ff0000', backgroundColor: '#cc0000', uiStyle: 'flat', backgroundStyle: 'pokemon', backgroundColor2: '#222224', backgroundColor3: '#f4f7fb' },
    { id: 'great-ball', name: 'Great Ball', themeColor: '#2563eb', backgroundColor: '#07111f', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#ef4444', backgroundColor3: '#dbeafe' },
    { id: 'ultra-ball', name: 'Ultra Ball', themeColor: '#facc15', backgroundColor: '#171613', uiStyle: 'neon', backgroundStyle: 'noise', backgroundColor2: '#f97316', backgroundColor3: '#cbd5e1' },
    { id: 'luxury-ball', name: 'Luxury Ball', themeColor: '#d4af37', backgroundColor: '#0b0a0c', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#7f1d1d', backgroundColor3: '#f8e7a2' },
    { id: 'dive-ball', name: 'Dive Ball', themeColor: '#22d3ee', backgroundColor: '#031826', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#0ea5e9', backgroundColor3: '#ecfeff' },
    { id: 'safari-ball', name: 'Safari Ball', themeColor: '#84cc16', backgroundColor: '#17210b', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#ca8a04', backgroundColor3: '#65a30d' },
    { id: 'premier-ball', name: 'Premier Ball', themeColor: '#dc2626', backgroundColor: '#eef2f7', uiStyle: 'flat', backgroundStyle: 'plain', backgroundColor2: '#dbe4ef', backgroundColor3: '#ef4444' },
    { id: 'moon-ball', name: 'Moon Ball', themeColor: '#f4d35e', backgroundColor: '#111827', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#60a5fa', backgroundColor3: '#d8b4fe' },
    { id: 'dream-ball', name: 'Dream Ball', themeColor: '#f0abfc', backgroundColor: '#21102b', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#fb7185', backgroundColor3: '#93c5fd' },
    { id: 'arcade-candy', name: 'Arcade Candy', themeColor: '#ff5d8f', backgroundColor: '#1b1234', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#00f5d4', backgroundColor3: '#ffd166' },
    { id: 'jungle-circuit', name: 'Jungle Circuit', themeColor: '#4ade80', backgroundColor: '#10251a', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#facc15', backgroundColor3: '#06b6d4' },
    { id: 'volcanic-glass', name: 'Volcanic Glass', themeColor: '#ff6b35', backgroundColor: '#24100b', uiStyle: 'glass', backgroundStyle: 'diagonal', backgroundColor2: '#f43f5e', backgroundColor3: '#fbbf24' },
    { id: 'deep-sea-lumen', name: 'Deep Sea Lumen', themeColor: '#2dd4bf', backgroundColor: '#082f49', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#38bdf8', backgroundColor3: '#a7f3d0' },
    { id: 'matcha-sakura', name: 'Matcha Sakura', themeColor: '#ef7a9b', backgroundColor: '#203828', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#86efac', backgroundColor3: '#f9a8d4' },
    { id: 'citrus-storm', name: 'Citrus Storm', themeColor: '#f97316', backgroundColor: '#243016', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#facc15', backgroundColor3: '#22c55e' },
    { id: 'violet-voltage', name: 'Violet Voltage', themeColor: '#a855f7', backgroundColor: '#160724', uiStyle: 'neon', backgroundStyle: 'neon', backgroundColor2: '#22d3ee', backgroundColor3: '#facc15' },
    { id: 'crimson-forge', name: 'Crimson Forge', themeColor: '#ef4444', backgroundColor: '#250b12', uiStyle: 'glass', backgroundStyle: 'noise', backgroundColor2: '#f97316', backgroundColor3: '#94a3b8' },
    { id: 'obsidian-jungle', name: 'Obsidian Jungle', themeColor: '#34d399', backgroundColor: '#071a14', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#a3e635', backgroundColor3: '#0ea5e9' },
    { id: 'starship-amber', name: 'Starship Amber', themeColor: '#f59e0b', backgroundColor: '#111827', uiStyle: 'glass', backgroundStyle: 'diagonal', backgroundColor2: '#38bdf8', backgroundColor3: '#f43f5e' },
    { id: 'phantom-rose', name: 'Phantom Rose', themeColor: '#fb7185', backgroundColor: '#1f1020', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#c084fc', backgroundColor3: '#2dd4bf' },
    { id: 'ultraviolet-sun', name: 'Ultraviolet Sun', themeColor: '#f6c945', backgroundColor: '#21063b', uiStyle: 'neon', backgroundStyle: 'aurora', backgroundColor2: '#ff4faa', backgroundColor3: '#4ff3ff' },
    { id: 'moss-noir', name: 'Moss Noir', themeColor: '#b7ff3c', backgroundColor: '#111b0d', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#7a5cff', backgroundColor3: '#ff7a2f' },
    { id: 'blueberry-brass', name: 'Blueberry Brass', themeColor: '#c99a2e', backgroundColor: '#121a35', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#5d8cff', backgroundColor3: '#ff6f91' },
    { id: 'ruby-static', name: 'Ruby Static', themeColor: '#32ffd2', backgroundColor: '#2a0710', uiStyle: 'neon', backgroundStyle: 'noise', backgroundColor2: '#ff315a', backgroundColor3: '#ffd447' },
    { id: 'ink-peacock', name: 'Ink Peacock', themeColor: '#1ee6a8', backgroundColor: '#061f2a', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#2f7df6', backgroundColor3: '#c45cff' },
    { id: 'plum-radio', name: 'Plum Radio', themeColor: '#ffe66d', backgroundColor: '#25102f', uiStyle: 'neon', backgroundStyle: 'diagonal', backgroundColor2: '#ff5c35', backgroundColor3: '#5cff9d' },
    { id: 'cobalt-ember', name: 'Cobalt Ember', themeColor: '#ff8a3d', backgroundColor: '#071739', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#2864ff', backgroundColor3: '#d7ff45' },
    { id: 'blackcurrant-laser', name: 'Blackcurrant Laser', themeColor: '#dfff4f', backgroundColor: '#18071f', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#ff2e88', backgroundColor3: '#3df5c6' },
    { id: 'pineapple-void', name: 'Pineapple Void', themeColor: '#ffe14a', backgroundColor: '#101407', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#b84cff', backgroundColor3: '#ff7043' },
    { id: 'midnight-saffron', name: 'Midnight Saffron', themeColor: '#ffca3a', backgroundColor: '#090d2b', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#2ee6ff', backgroundColor3: '#ff5a7a' },
    { id: 'nes-classic', name: 'NES Classic', themeColor: '#e60012', backgroundColor: '#d6d3c8', uiStyle: 'flat', backgroundStyle: 'pixel', backgroundColor2: '#5b5b63', backgroundColor3: '#2049c8' },
    { id: 'candy-sky', name: 'Candy Sky', themeColor: '#00a6fb', backgroundColor: '#dff7ff', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#ff5d8f', backgroundColor3: '#ffd166' },
    { id: 'mint-orchid', name: 'Mint Orchid', themeColor: '#8b5cf6', backgroundColor: '#ddf8ec', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#10b981', backgroundColor3: '#f472b6' },
    { id: 'coral-breeze', name: 'Coral Breeze', themeColor: '#f97316', backgroundColor: '#ffe1dc', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#06b6d4', backgroundColor3: '#fb7185' },
    { id: 'prism-garden', name: 'Prism Garden', themeColor: '#22c55e', backgroundColor: '#e9f7d8', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#a855f7', backgroundColor3: '#f59e0b' },
    { id: 'aurora-day', name: 'Aurora Day', themeColor: '#3b82f6', backgroundColor: '#e6f0ff', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#14b8a6', backgroundColor3: '#c084fc' },
    { id: 'berry-soda', name: 'Berry Soda', themeColor: '#d946ef', backgroundColor: '#f7e7ff', uiStyle: 'neon', backgroundStyle: 'pokemon', backgroundColor2: '#22d3ee', backgroundColor3: '#fb7185' },
    { id: 'lime-pop', name: 'Lime Pop', themeColor: '#65a30d', backgroundColor: '#ecfccb', uiStyle: 'flat', backgroundStyle: 'pixel', backgroundColor2: '#0ea5e9', backgroundColor3: '#f97316' },
    { id: 'sunset-parfait', name: 'Sunset Parfait', themeColor: '#f43f5e', backgroundColor: '#ffe8c7', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#f59e0b', backgroundColor3: '#8b5cf6' },
    { id: 'aqua-lagoon', name: 'Aqua Lagoon', themeColor: '#0891b2', backgroundColor: '#d7fbf4', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#2563eb', backgroundColor3: '#84cc16' },
    { id: 'lavender-tech', name: 'Lavender Tech', themeColor: '#7c3aed', backgroundColor: '#eee7ff', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#06b6d4', backgroundColor3: '#f472b6' },
    { id: 'peach-terminal', name: 'Peach Terminal', themeColor: '#ea580c', backgroundColor: '#ffead5', uiStyle: 'soft', backgroundStyle: 'noise', backgroundColor2: '#10b981', backgroundColor3: '#f43f5e' },
    { id: 'pixel-meadow', name: 'Pixel Meadow', themeColor: '#16a34a', backgroundColor: '#dff7d9', uiStyle: 'flat', backgroundStyle: 'pixel', backgroundColor2: '#facc15', backgroundColor3: '#38bdf8' },
    { id: 'bubblegum-map', name: 'Bubblegum Map', themeColor: '#ec4899', backgroundColor: '#ffe4f1', uiStyle: 'soft', backgroundStyle: 'pokemon', backgroundColor2: '#60a5fa', backgroundColor3: '#fbbf24' },
    { id: 'stormglass-light', name: 'Stormglass Light', themeColor: '#475569', backgroundColor: '#e8edf6', uiStyle: 'glass', backgroundStyle: 'noise', backgroundColor2: '#7c3aed', backgroundColor3: '#94a3b8' },
    { id: 'dragonfruit', name: 'Dragonfruit', themeColor: '#be185d', backgroundColor: '#fce7f3', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#7c3aed', backgroundColor3: '#fb923c' },
    { id: 'tropical-byte', name: 'Tropical Byte', themeColor: '#00b894', backgroundColor: '#fff3bf', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#ff006e', backgroundColor3: '#00bbf9' },
    { id: 'honeydew-drive', name: 'Honeydew Drive', themeColor: '#ca8a04', backgroundColor: '#f7fee7', uiStyle: 'flat', backgroundStyle: 'diamond', backgroundColor2: '#22c55e', backgroundColor3: '#0ea5e9' },
    { id: 'opal-dream', name: 'Opal Dream', themeColor: '#0ea5e9', backgroundColor: '#ecfeff', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#a78bfa', backgroundColor3: '#34d399' },
    { id: 'rose-circuit', name: 'Rose Circuit', themeColor: '#e11d48', backgroundColor: '#ffe4e6', uiStyle: 'soft', backgroundStyle: 'mesh', backgroundColor2: '#2563eb', backgroundColor3: '#f59e0b' },
    { id: 'kiwi-console', name: 'Kiwi Console', themeColor: '#4d7c0f', backgroundColor: '#eef9d2', uiStyle: 'flat', backgroundStyle: 'pixel', backgroundColor2: '#65a30d', backgroundColor3: '#7c3aed' },
    { id: 'cloudberry', name: 'Cloudberry', themeColor: '#9333ea', backgroundColor: '#f0e7ff', uiStyle: 'glass', backgroundStyle: 'noise', backgroundColor2: '#38bdf8', backgroundColor3: '#fb7185' },
    { id: 'mango-nebula', name: 'Mango Nebula', themeColor: '#fb8500', backgroundColor: '#ffefd6', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#8338ec', backgroundColor3: '#00b4d8' },
    { id: 'jade-carnival', name: 'Jade Carnival', themeColor: '#008f7a', backgroundColor: '#d9fbe9', uiStyle: 'soft', backgroundStyle: 'diamond', backgroundColor2: '#ff4d6d', backgroundColor3: '#f9c74f' },
    { id: 'cotton-circuit', name: 'Cotton Circuit', themeColor: '#2563eb', backgroundColor: '#e7f0ff', uiStyle: 'flat', backgroundStyle: 'pixel', backgroundColor2: '#f472b6', backgroundColor3: '#22c55e' },
    { id: 'papaya-splash', name: 'Papaya Splash', themeColor: '#f97316', backgroundColor: '#ffe4b8', uiStyle: 'soft', backgroundStyle: 'pokemon', backgroundColor2: '#0ea5e9', backgroundColor3: '#ec4899' },
    { id: 'glacier-bloom', name: 'Glacier Bloom', themeColor: '#0284c7', backgroundColor: '#dff9ff', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#a855f7', backgroundColor3: '#10b981' },
    { id: 'lemon-arcade', name: 'Lemon Arcade', themeColor: '#ca8a04', backgroundColor: '#fff7ad', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#06b6d4', backgroundColor3: '#f43f5e' },
    { id: 'pearl-lab', name: 'Pearl Lab', themeColor: '#64748b', backgroundColor: '#edf2f7', uiStyle: 'glass', backgroundStyle: 'noise', backgroundColor2: '#14b8a6', backgroundColor3: '#8b5cf6' },
    { id: 'strawberry-ink', name: 'Strawberry Ink', themeColor: '#2b2d8f', backgroundColor: '#ffd6df', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#ff8a00', backgroundColor3: '#00a878' },
    { id: 'pistachio-plum', name: 'Pistachio Plum', themeColor: '#6d2e8a', backgroundColor: '#e5ffd2', uiStyle: 'glass', backgroundStyle: 'mesh', backgroundColor2: '#ff6b3d', backgroundColor3: '#1aa7ec' },
    { id: 'apricot-cobalt', name: 'Apricot Cobalt', themeColor: '#174ea6', backgroundColor: '#ffd9b0', uiStyle: 'flat', backgroundStyle: 'pokemon', backgroundColor2: '#ff3864', backgroundColor3: '#35c4b5' },
    { id: 'lilac-cider', name: 'Lilac Cider', themeColor: '#9a3412', backgroundColor: '#eadbff', uiStyle: 'soft', backgroundStyle: 'aurora', backgroundColor2: '#4d9f0c', backgroundColor3: '#ff4fb8' },
    { id: 'cyan-sorbet', name: 'Cyan Sorbet', themeColor: '#c2416b', backgroundColor: '#d0fff8', uiStyle: 'glass', backgroundStyle: 'diamond', backgroundColor2: '#6157ff', backgroundColor3: '#ffb000' },
    { id: 'banana-reef', name: 'Banana Reef', themeColor: '#006d77', backgroundColor: '#fff0a6', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#ff5e57', backgroundColor3: '#7b2cbf' },
    { id: 'powder-garnet', name: 'Powder Garnet', themeColor: '#9f1239', backgroundColor: '#dcecff', uiStyle: 'glass', backgroundStyle: 'noise', backgroundColor2: '#00a676', backgroundColor3: '#ffb703' },
    { id: 'melon-arcade', name: 'Melon Arcade', themeColor: '#463f9f', backgroundColor: '#dcffd6', uiStyle: 'neon', backgroundStyle: 'pixel', backgroundColor2: '#ff007c', backgroundColor3: '#ffbf00' },
    { id: 'sky-paprika', name: 'Sky Paprika', themeColor: '#b63b1d', backgroundColor: '#d8f1ff', uiStyle: 'soft', backgroundStyle: 'diagonal', backgroundColor2: '#6a00f4', backgroundColor3: '#78c841' },
    { id: 'orchid-limeade', name: 'Orchid Limeade', themeColor: '#6f1d77', backgroundColor: '#f2ffd5', uiStyle: 'glass', backgroundStyle: 'aurora', backgroundColor2: '#00b2a9', backgroundColor3: '#ff7f11' },
  ]), []);

  const filteredThemePresets = useMemo(
    () => themePresets.filter((preset) => getPresetTone(preset) === presetTone),
    [themePresets, presetTone],
  );

  const lightPresetCount = useMemo(
    () => themePresets.filter((preset) => getPresetTone(preset) === 'light').length,
    [themePresets],
  );

  const darkPresetCount = themePresets.length - lightPresetCount;

  const backgroundStyleOptions = useMemo<Array<{ id: BackgroundStyle; label: string }>>(() => ([
    { id: 'plain', label: 'Plain' },
    { id: 'aurora', label: 'Aurora' },
    { id: 'mesh', label: 'Mesh' },
    { id: 'diagonal', label: 'Diagonal' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'pixel', label: 'Pixel' },
    { id: 'neon', label: 'Neon' },
    { id: 'noise', label: 'Noise' },
    { id: 'pokemon', label: 'Pokemon' },
  ]), []);

  const backgroundPresets = [
    '#0f172a',
    '#1e1b4b',
    '#1f2937',
    '#18181b',
    '#0c0a09',
    '#171717',
    '#14532d',
    '#1e3a8a',
  ];

  useEffect(() => {
    if (!open) return;
    if (skipNextOpenSyncRef.current) {
      skipNextOpenSyncRef.current = false;
      return;
    }

    if (preferences) {
      setPresetId('custom');
      setThemeColor(isRandom ? accentColor : preferences.theme_color || DEFAULT_THEME_COLOR);
      setBackgroundColor(preferences.background_color || DEFAULT_BACKGROUND_COLOR);
      setLayoutStyle(preferences.layout_style || 'grid');
    }

    const current = {
      uiStyle: getStoredUiStyle(),
      backgroundStyle: getStoredBackgroundStyle(),
      backgroundColor2: getStoredBackgroundAccent2(),
      backgroundColor3: getStoredBackgroundAccent3(),
    };
    initialAppearanceRef.current = current;
    setUiStyle(current.uiStyle);
    setBackgroundStyle(current.backgroundStyle);
    setBackgroundColor2(current.backgroundColor2);
    setBackgroundColor3(current.backgroundColor3);
  }, [preferences, open, isRandom, accentColor]);

  useEffect(() => {
    if (!open) return;
    applyUiStyleToRoot(uiStyle);
  }, [uiStyle, open]);

  useEffect(() => {
    if (!open) return;
    applyBackgroundStyleToRoot(backgroundStyle);
  }, [backgroundStyle, open]);

  useEffect(() => {
    if (!open) return;
    applyBackgroundAccentsToRoot(backgroundColor2, backgroundColor3);
  }, [backgroundColor2, backgroundColor3, open]);

  const handleCloseWithoutSave = () => {
    const original = initialAppearanceRef.current;
    if (!original) return;
    setUiStyle(original.uiStyle);
    setBackgroundStyle(original.backgroundStyle);
    setBackgroundColor2(original.backgroundColor2);
    setBackgroundColor3(original.backgroundColor3);
    applyUiStyleToRoot(original.uiStyle);
    applyBackgroundStyleToRoot(original.backgroundStyle);
    applyBackgroundAccentsToRoot(original.backgroundColor2, original.backgroundColor3);
  };

  const applyPreset = (id: string) => {
    if (id === 'custom') {
      setPresetId('custom');
      return;
    }

    const preset = themePresets.find((p) => p.id === id);
    if (!preset) return;

    setPresetId(id);
    setThemeColor(preset.themeColor);
    setBackgroundColor(preset.backgroundColor);
    setUiStyle(preset.uiStyle);
    setBackgroundStyle(preset.backgroundStyle);
    setBackgroundColor2(preset.backgroundColor2);
    setBackgroundColor3(preset.backgroundColor3);
  };

  const handleSave = async () => {
    setSaving(true);
    setManualColor(themeColor);

    const result = await savePreferences({
      theme_color: themeColor,
      background_color: backgroundColor,
      layout_style: layoutStyle,
    });

    if (result?.success) {
      setStoredUiStyle(uiStyle);
      setStoredBackgroundStyle(backgroundStyle);
      setStoredBackgroundAccent2(backgroundColor2);
      setStoredBackgroundAccent3(backgroundColor3);
      setSaving(false);
      toast({
        title: 'Preferenze salvate',
        description: 'Colori e sfondo aggiornati correttamente',
      });
      setOpen(false);
    } else {
      setSaving(false);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: result?.error || 'Impossibile salvare le preferenze',
      });
    }
  };

  const previewAccent2 = backgroundColor2 || themeColor;
  const previewAccent3 = backgroundColor3 || DEFAULT_BG_ACCENT_3;

  const handleReset = () => {
    resetToRandom();

    void savePreferences({
      theme_color: null,
      background_color: backgroundColor,
      layout_style: layoutStyle,
    });

    toast({
      title: 'Modalita random attiva',
      description: 'I colori seguiranno il tema della Home',
    });
    setOpen(false);
  };

  const handlePickColor = async (target: 'button' | 'background') => {
    if (!window.EyeDropper) {
      toast({
        variant: 'destructive',
        title: 'Pipetta non disponibile',
        description: 'Il browser non supporta la selezione colore dallo schermo.',
      });
      return;
    }

    try {
      flushSync(() => setOpen(false));
      const result = await new window.EyeDropper().open();
      setPresetId('custom');

      if (target === 'button') {
        setThemeColor(result.sRGBHex);
        setManualColor(result.sRGBHex);
        skipNextOpenSyncRef.current = true;
        setOpen(true);
        toast({
          title: 'Colore pulsante applicato',
          description: result.sRGBHex,
        });
        return;
      }

      setBackgroundColor(result.sRGBHex);
      skipNextOpenSyncRef.current = true;
      setOpen(true);
      toast({
        title: 'Colore sfondo applicato',
        description: result.sRGBHex,
      });
    } catch (err: any) {
      skipNextOpenSyncRef.current = true;
      setOpen(true);
      if (err?.name === 'AbortError') return;
      toast({
        variant: 'destructive',
        title: 'Errore pipetta',
        description: 'Non sono riuscito a leggere il colore selezionato.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && open) handleCloseWithoutSave();
      setOpen(v);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-[3.25rem] w-[3.25rem] rounded-xl border-2 bg-gradient-to-b from-muted to-background text-card-foreground outline outline-1 outline-black/10 transition-all duration-300 hover:brightness-105 dark:from-muted/80 dark:to-background dark:outline-white/15"
          style={{
            borderColor: accentColor,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -10px 20px rgba(0,0,0,0.10), 0 0 16px ${accentColor}45`,
          }}
        >
          {colorScheme === 'dark'
            ? <Moon className="h-6 w-6 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]" />
            : <Sun className="h-6 w-6 text-amber-600 drop-shadow-[0_0_6px_rgba(251,191,36,0.75)]" />}
          <span className="sr-only">Impostazioni colori</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-border bg-background p-0 text-card-foreground shadow-2xl">
        <DialogHeader className="border-b border-border bg-card px-4 pb-3 pt-4 sm:px-5">
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card">
              <Paintbrush className="h-4 w-4" />
            </span>
            Tema app
          </DialogTitle>
          <DialogDescription>Personalizza tema, sfondo e modalita dell'app.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 bg-muted/25 p-4 sm:p-5">
          <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              Temi rapidi
            </Label>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setPresetTone('light')}
                className={`flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                  presetTone === 'light' ? 'bg-card text-card-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">{lightPresetCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setPresetTone('dark')}
                className={`flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                  presetTone === 'dark' ? 'bg-card text-card-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">{darkPresetCount}</span>
              </button>
            </div>
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setPresetId('custom')}
                className={`flex min-h-14 items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                  presetId === 'custom' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 rounded-full border border-border p-1">
                  <span className="h-full flex-1 rounded-l-full" style={{ backgroundColor: themeColor }} />
                  <span className="h-full flex-1 rounded-r-full" style={{ backgroundColor }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">Personalizzato</span>
                  <span className="block truncate text-xs text-muted-foreground">Colori attuali</span>
                </span>
                {presetId === 'custom' && <Check className="h-4 w-4 text-primary" />}
              </button>

              {filteredThemePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`flex min-h-14 items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                    presetId === preset.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 rounded-full border border-border p-1">
                    <span className="h-full flex-1 rounded-l-full" style={{ backgroundColor: preset.themeColor }} />
                    <span className="h-full flex-1 rounded-r-full" style={{ backgroundColor: preset.backgroundColor }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{preset.name}</span>
                    <span className="block truncate text-xs capitalize text-muted-foreground">{preset.backgroundStyle}</span>
                  </span>
                  {presetId === preset.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Sun className="h-4 w-4" />
                Modalita
              </Label>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1 lg:grid-cols-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setColorScheme('light');
                    setPresetTone('light');
                  }}
                  className={`h-11 rounded-lg ${
                    colorScheme === 'light' ? 'bg-card text-card-foreground shadow-sm hover:bg-card' : 'text-muted-foreground'
                  }`}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setColorScheme('dark');
                    setPresetTone('dark');
                  }}
                  className={`h-11 rounded-lg ${
                    colorScheme === 'dark' ? 'bg-card text-card-foreground shadow-sm hover:bg-card' : 'text-muted-foreground'
                  }`}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Palette className="h-4 w-4" />
                Palette
              </Label>
              <div className="grid gap-2 rounded-lg border border-border bg-background p-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePickColor('button')}
                  className="h-10 justify-center gap-2"
                  style={{ borderColor: `${accentColor}80`, color: accentColor }}
                >
                  <Pipette className="h-4 w-4" />
                  Pipetta pulsante
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePickColor('background')}
                  className="h-10 justify-center gap-2"
                >
                  <Pipette className="h-4 w-4" />
                  Pipetta sfondo
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant={isRandom ? 'default' : 'outline'}
                    onClick={handleReset}
                    className="h-11 w-full justify-start rounded-xl border-dashed"
                    style={isRandom ? { backgroundColor: accentColor } : { borderColor: `${accentColor}80`, color: accentColor }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Usa colore Home
                  </Button>

                  <ColorPicker
                    label="Colore principale"
                    value={themeColor}
                    hideDesktopAdvancedPicker
                    onChange={(color) => {
                      setPresetId('custom');
                      setThemeColor(color);
                    }}
                  />
                </div>

                <ColorPicker
                  label="Colore sfondo"
                  value={backgroundColor}
                  hideDesktopAdvancedPicker
                  onChange={(color) => {
                    setPresetId('custom');
                    setBackgroundColor(color);
                  }}
                  presets={backgroundPresets}
                />
              </div>
            </section>
          </div>

          <section className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Image className="h-4 w-4" />
              Sfondo pagina
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {backgroundStyleOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setPresetId('custom');
                    setBackgroundStyle(option.id);
                  }}
                  className={`overflow-hidden rounded-lg border text-left transition-all hover:border-primary/60 hover:bg-muted/40 ${
                    backgroundStyle === option.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background'
                  }`}
                >
                  <span
                    className="block h-14 border-b border-border/70"
                    style={{
                      backgroundColor,
                      backgroundImage: getBackgroundPreview(option.id, backgroundColor, themeColor, previewAccent2, previewAccent3),
                      backgroundSize:
                        option.id === 'pokemon'
                          ? '40px 40px, auto, auto'
                          : option.id === 'pixel'
                            ? 'cover, 18px 18px, 18px 18px'
                            : 'cover',
                    }}
                  />
                  <span className="flex items-center justify-between gap-2 p-2.5">
                    <span className="truncate text-sm font-medium">{option.label}</span>
                    {backgroundStyle === option.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </span>
                </button>
              ))}
            </div>

            {backgroundStyle !== 'plain' && (
              <div className="grid gap-3 pt-1 md:grid-cols-2">
                <ColorPicker
                  label="Accento sfondo 2"
                  value={previewAccent2}
                  hideDesktopAdvancedPicker
                  onChange={(color) => {
                    setPresetId('custom');
                    setBackgroundColor2(color);
                  }}
                />
                <ColorPicker
                  label="Accento sfondo 3"
                  value={previewAccent3}
                  hideDesktopAdvancedPicker
                  onChange={(color) => {
                    setPresetId('custom');
                    setBackgroundColor3(color);
                  }}
                />
              </div>
            )}
          </section>

          <div className="flex gap-2 border-t border-border/70 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="h-11 flex-1 rounded-xl shiny-glow"
              style={{ backgroundColor: accentColor }}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvataggio...' : 'Salva preferenze'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
