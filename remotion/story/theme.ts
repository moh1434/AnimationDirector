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
  hands?: string; // hand colour (default white); set it with a non-white skin
  shirtSymbol?: "star" | "heart";
  head?: "round" | "egg" | "wide";
  hair?: string; // none|tuft|spiky|curly|long|bob|bun|side|messy|wavy|ponytail|flowing|sideponytail|curlytop|starbuns|curlypuff|highponytail|schoolbob|sidebob|shaggy|quiff
  hairColor?: string;
  hairTips?: string; // colour of the dip-dyed ends (starbuns)
  hat?: string; // none|cap|grad|crown|turban|helmet|hardhat|tophat|headscarf|beret|wizard|chef|fez|keffiyeh|safari|bow
  hatColor?: string;
  facial?: string; // none|beard|mustache|goatee|longbeard
  shirt?: string;
  outfit?: string; // shirt|vest|coat|suit|robe|dress|hoodie|ziphoodie|armor|tunic|belted|frilldress|sweatervest|pinafore|dungarees|sailor|chefcoat|hoodieskirt
  pants?: string;
  accessory?: string; // none|glasses|sunglasses|scarf|tie|bowtie|medal|monocle|neckerchief
  extras?: string[]; // backpack|flower_necklace|notebook (drawn in addition to the accessory)
  accent?: string;
  blush?: boolean;
  freckles?: boolean;
  lashes?: boolean; // eyelashes
  shoes?: string; // shoe colour (default: plain dark feet)
  socks?: string; // knee socks in this colour (bare-leg outfits)
  tights?: string; // full-length tights in this colour (bare-leg outfits)
  hightops?: boolean; // high-top sneakers in the shoes colour, with a white sole and toe cap
  sneakers?: boolean; // low canvas sneakers in the shoes colour, with a white sole and toe cap
  cargo?: boolean; // trousers with a pocket on each thigh and rolled-up cuffs (outfits with trousers)
  hairClip?: string; // cherry (replaces the highponytail bow; the cherries take hatColor)
  height?: number; // relative, 1 = normal
};

/** Ready-made cast. All original designs. */
export const PRESETS: Record<string, Look> = {
  thief: { skin:"#fff", hair:"none", hat:"beanie", hatColor:"#323640", shirt:"#fff", outfit:"striped", pants:"#323640", accessory:"mask" },
  farmer: { skin:"#fff", hair:"side", hat:"straw", hatColor:"#e8c27a", shirt:"#3ddc97", outfit:"overalls", pants:"#3b8df0" },
  // A schoolgirl in a generic sailor-style uniform: straight bob with a blunt fringe and a clip, white blouse,
  // navy collar and pleated skirt, red ribbon, knee socks, loafers, backpack.
  schoolgirl: { skin: "#ffffff", hair: "schoolbob", hairColor: "#4a4158", hatColor: "#e0445a", outfit: "sailor", shirt: "#4055a0", accent: "#e0445a", socks: "#4055a0", shoes: "#7a4f3a", extras: ["backpack"], blush: true, lashes: true, height: 0.88 },
  policeman: {skin:"#ffffff", hair:"none", hat:"police_cap", hatColor:"#315486", outfit:"police_uniform", shirt:"#315486", pants:"#243955", accent:"#ffc83d"},
  // Berry, the channel's leader. Berry-pink "star buns" hair with light pink ends, a springy curl and a star clip, freckles,
  // a sunny pinafore over a white tee, coral shoes. Original design.
  berry: { skin: "#ffffff", hair: "starbuns", hairColor: "#b04a78", hairTips: "#ffc0d0", outfit: "pinafore", shirt: "#ffc83d", accent: "#ff6b5e", shoes: "#ff6b5e", blush: true, freckles: true, lashes: true, height: 0.9 },
  // From the user's character sheet: plum curls with a big side puff and a coral bow, freckles,
  // yellow tee under teal short dungarees with a heart pocket, coral sneakers.
  curly_girl: { skin: "#ffe8cf", hands: "#ffe8cf", hair: "curlypuff", hairColor: "#7a2a55", hatColor: "#ff6b5e", outfit: "dungarees", shirt: "#ffc83d", pants: "#7cc4ad", accent: "#ff6b5e", shoes: "#ff6b5e", freckles: true, lashes: true, height: 0.88 },
  // Benny: Berry's and Cherry's friend. White round face, brown quiff with cropped sides, a yellow hoodie with white-tipped
  // drawstrings, dark grey cargo trousers with rolled cuffs, yellow sneakers.
  // ("host" and "narrator" are his old names and still select him: PRESET_ALIASES.)
  benny: { skin: "#ffffff", hair: "quiff", hairColor: "#7a4a2c", outfit: "hoodie", shirt: "#f6c220", pants: "#4a4c55", cargo: true, shoes: "#f6c220", sneakers: true },
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
  chef: { skin: "#ffffff", hat: "chef", outfit: "chefcoat", shirt: "#ffffff", pants: "#6a7180", accent: "#e0445a", facial: "mustache", hairColor: INK },
  wizard: { skin: "#ffffff", hat: "wizard", hatColor: "#4b3aa8", facial: "longbeard", hairColor: "#ececec", outfit: "robe", shirt: "#4b3aa8" },
  grandpa: { skin: "#ffffff", hair: "bald", hairColor: "#dddddd", facial: "mustache", accessory: "glasses", outfit: "vest", shirt: "#8d6e63" },
  robotguy: { skin: "#dfe6ee", hair: "none", hat: "none", outfit: "armor", shirt: "#90a4ae", accessory: "sunglasses" },
  // From the user's character sheets (remotion/characters/…):
  // First_Female_Character — explorer girl: purple flowing hair, safari hat with a leaf, orange neckerchief, backpack
  adventurer: { skin: "#ffffff", hair: "flowing", hairColor: "#b58be0", hat: "safari", hatColor: "#f2d7a6", outfit: "belted", shirt: "#f2d7a6", accessory: "neckerchief", accent: "#ff8a2a", extras: ["backpack"], height: 0.9 },
  // Second_Female_Character — one high pink ponytail with a yellow bow at its root, strand fringe, purple frilled dress, flower necklace
  ponytail_girl: { skin: "#ffffff", hair: "highponytail", hairColor: "#f2607f", hatColor: "#ffd93b", outfit: "frilldress", shirt: "#9b6bd6", extras: ["flower_necklace"], blush: true, lashes: true, height: 0.86 },
  // Cherry — from the user's sheet: dark brown high ponytail with a cherry clip, roomy red hoodie with white
  // drawstrings, short black pleated skirt with a light stripe, black tights, red high-top sneakers.
  cherry: { skin: "#ffe3d3", hands: "#ffe3d3", hair: "highponytail", hairColor: "#4a2a26", hatColor: "#e0263c", hairClip: "cherry", outfit: "hoodieskirt", shirt: "#d8283c", pants: "#2b2430", tights: "#2b2430", shoes: "#d8283c", hightops: true, blush: true, lashes: true, height: 0.88 },
  // Second_Male_Character — spiky orange hair, blue shirt, red scarf
  buddy: { skin: "#ffffff", hair: "spiky", hairColor: "#ff8a3d", outfit: "shirt", shirt: "#4f7bff", accessory: "scarf", accent: "#e53950", height: 0.85 },
  // Third_Male_Character — curly brown hair, round glasses, green argyle sweater vest over a white shirt
  bookworm: { skin: "#ffffff", hair: "curlytop", hairColor: "#9a5a32", outfit: "sweatervest", shirt: "#4caf50", accent: "#8fd36b", accessory: "glasses" },
  // Somi: side-swept plum bob, mint clip, sage zip hoodie and a pocket notebook.
  somi: {
    skin: "#ffffff", hair: "sidebob", hairColor: "#49263e", hatColor: "#a4d7b7",
    outfit: "ziphoodie", shirt: "#a0ae8b", accent: "#f6e7c8", pants: "#3b374c",
    cargo: true, shoes: "#735183", sneakers: true, extras: ["notebook"],
  },
};

/** Other names that select a preset (the folder names of the user's character sheets). */
export const PRESET_ALIASES: Record<string, string> = {
  police: "policeman", police_officer: "policeman",
  host: "benny", narrator: "benny", main_male: "benny", main_male_character: "benny",
  leader: "berry", main_female: "berry", main_female_character: "berry", main_girl: "berry",
  nova: "berry", // her first name; projects/meet-nova still casts her as "nova"
  first_female: "adventurer", first_female_character: "adventurer", explorer_girl: "adventurer",
  second_female: "ponytail_girl", second_female_character: "ponytail_girl",
  second_male: "buddy", second_male_character: "buddy",
  third_male: "bookworm", third_male_character: "bookworm", nerd: "bookworm",
};

export const lookFor = (preset?: string, overrides?: Look): Look => ({
  ...(PRESETS[preset ?? "benny"] ?? PRESETS[PRESET_ALIASES[String(preset).toLowerCase()] ?? ""] ?? PRESETS.benny),
  ...(overrides ?? {}),
});
