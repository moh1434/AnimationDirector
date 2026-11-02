// Visual language distilled from the reference videos: flat saturated grounds,
// thick dark outlines, white-faced round-headed characters, warm accent colors.

export const INK = "#1d1b20";
export const OUTLINE = 7; // in character space (≈ 520 units tall)

export const BG: Record<string, string> = {
  mint: "#9ff5cf",
  aqua: "#c6f7ee",
  yellow: "#fff3a3",
  lemon: "#f7f06d",
  cream: "#fff1d6",
  peach: "#ffc9a8",
  orange: "#ffad5e",
  pink: "#ffb3c7",
  rose: "#e8737f",
  red: "#d93a4a",
  lilac: "#cfb6ff",
  purple: "#6a35d6",
  indigo: "#3326a3",
  sky: "#a8dcff",
  blue: "#3f7ff0",
  teal: "#2fb8a6",
  lime: "#b9f26b",
  green: "#5fcf73",
  paper: "#e4e8ea",
  white: "#fbfbf8",
  slate: "#2f3640",
  night: "#1b1830",
  black: "#0b0b0d",
};

/** Ground colors that read well behind white-faced characters (cycled by the director). */
export const BG_CYCLE = ["mint", "yellow", "lilac", "sky", "peach", "aqua", "pink", "lime", "cream", "paper"];

export const SHIRTS = ["#4f7bff", "#ff6b8b", "#ffc83d", "#3ddc97", "#b05cff", "#ff8a3d", "#e53950", "#29b6f6", "#8bc34a"];

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
};

export const resolveColor = (c: string | undefined, fallback = BG.mint) => {
  if (!c) return fallback;
  if (c.startsWith("#") || c.startsWith("rgb") || c.startsWith("hsl")) return c;
  return BG[c] ?? fallback;
};

export const FONT = {
  body: "'Baloo Bhaijaan 2', 'Segoe UI', Tahoma, sans-serif",
  display: "'Lalezar', 'Baloo Bhaijaan 2', Impact, sans-serif",
};

export type Look = {
  skin?: string;
  head?: "round" | "egg" | "wide";
  hair?: string; // none|tuft|spiky|curly|long|bob|bun|side|messy|wavy|ponytail
  hairColor?: string;
  hat?: string; // none|cap|grad|crown|turban|helmet|hardhat|tophat|headscarf|beret|wizard|chef|fez|keffiyeh
  hatColor?: string;
  facial?: string; // none|beard|mustache|goatee|longbeard
  shirt?: string;
  outfit?: string; // shirt|vest|coat|suit|robe|dress|hoodie|armor|tunic
  pants?: string;
  accessory?: string; // none|glasses|sunglasses|scarf|tie|bowtie|medal|monocle
  accent?: string;
  blush?: boolean;
  height?: number; // relative, 1 = normal
};

/** Ready-made cast. All original designs. */
export const PRESETS: Record<string, Look> = {
  // Default narrator / host: white round face, orange scarf, single curl.
  host: { skin: "#ffffff", hair: "tuft", hairColor: INK, outfit: "shirt", shirt: "#ffd23f", pants: INK, accessory: "scarf", accent: "#ff7a2f" },
  scientist: { skin: "#ffffff", hair: "messy", hairColor: "#cfd4da", outfit: "coat", shirt: "#ffffff", accessory: "glasses", accent: "#4f7bff" },
  student: { skin: "#ffffff", hair: "side", hairColor: "#3a2a20", outfit: "hoodie", shirt: "#4f7bff" },
  girl: { skin: "#ffffff", hair: "long", hairColor: "#5a3825", outfit: "dress", shirt: "#ff6b8b", blush: true },
  woman: { skin: "#ffffff", hair: "bun", hairColor: "#2b1d16", outfit: "shirt", shirt: "#b05cff", accessory: "none", blush: true },
  kid: { skin: "#ffffff", hair: "spiky", hairColor: "#ffb300", outfit: "shirt", shirt: "#3ddc97", height: 0.78 },
  king: { skin: "#ffffff", hair: "none", hat: "crown", facial: "beard", hairColor: "#6d4c41", outfit: "robe", shirt: "#c62f4b", accent: "#ffc83d" },
  sage: { skin: "#ffffff", hat: "turban", hatColor: "#f4f1ea", facial: "longbeard", hairColor: "#e8e8e8", outfit: "robe", shirt: "#3fa58c" },
  soldier: { skin: "#ffffff", hat: "helmet", hatColor: "#5b6b3a", outfit: "armor", shirt: "#6f7f45", facial: "mustache", hairColor: "#3a2a20" },
  worker: { skin: "#ffffff", hat: "hardhat", hatColor: "#ffc107", outfit: "vest", shirt: "#ff8a3d" },
  boss: { skin: "#ffffff", hair: "side", hairColor: "#9aa0a6", outfit: "suit", shirt: "#30343f", accessory: "tie", accent: "#e53950", facial: "mustache" },
  explorer: { skin: "#ffffff", hat: "cap", hatColor: "#c8a26b", outfit: "vest", shirt: "#a1887f", accessory: "none" },
  pharaoh: { skin: "#ffffff", hat: "pharaoh", hatColor: "#3f6fd8", accent: "#ffc83d", outfit: "tunic", shirt: "#f5f0e1", facial: "goatee", hairColor: INK },
  bedouin: { skin: "#ffffff", hat: "keffiyeh", hatColor: "#ffffff", accent: "#d93a4a", outfit: "robe", shirt: "#f2ece0", facial: "beard", hairColor: INK },
  chef: { skin: "#ffffff", hat: "chef", outfit: "coat", shirt: "#ffffff", facial: "mustache", hairColor: INK },
  wizard: { skin: "#ffffff", hat: "wizard", hatColor: "#4b3aa8", facial: "longbeard", hairColor: "#ececec", outfit: "robe", shirt: "#4b3aa8" },
  grandpa: { skin: "#ffffff", hair: "bald", hairColor: "#dddddd", facial: "mustache", accessory: "glasses", outfit: "vest", shirt: "#8d6e63" },
  robotguy: { skin: "#dfe6ee", hair: "none", hat: "none", outfit: "armor", shirt: "#90a4ae", accessory: "sunglasses" },
};

export const lookFor = (preset?: string, overrides?: Look): Look => ({
  ...(PRESETS[preset ?? "host"] ?? PRESETS.host),
  ...(overrides ?? {}),
});
