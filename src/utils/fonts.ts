/** Shared font helpers so every surface applies the same CSS family + Google Font load. */

const SYSTEM_FONTS = new Set(["serif", "sans-serif", "monospace"]);

const MONO_FONTS = new Set([
  "monospace",
  "anonymous-pro",
  "ubuntu-sans-mono",
  "nova-mono",
  "syne-mono",
  "vt323",
  "xanh-mono",
  "cutive-mono",
]);

const SERIF_FONTS = new Set([
  "serif",
  "arbutus-slab",
  "nixie-one",
  "noticia-text",
  "arvo",
  "oi",
  "gloock",
]);

const HANDWRITING_FONTS = new Set([
  "indie-flower",
  "give-you-glory",
  "annie-use-your-telescope",
  "nothing-you-could-do",
  "oooh-baby",
  "over-the-rainbow",
  "pangolin",
  "autour-one",
  "permanent-marker",
  "reenie-beanie",
  "rock-salt",
  "schoolbell",
  "sedgwick-ave",
  "shadows-into-light",
  "short-stack",
  "shantell-sans",
  "solitreo",
  "sue-ellen-francisco",
  "sunshiney",
  "swanky-and-moo-moo",
  "the-girl-next-door",
  "tillana",
  "unkempt",
  "waiting-for-the-sunrise",
  "beth-ellen",
  "homemade-apple",
  "zeyada",
  "cedarville-cursive",
  "coming-soon",
  "covered-by-your-grace",
  "crafty-girls",
  "comforter",
  "oregano",
  "protest-revolution",
  "protest-riot",
  "rancho",
  "sarina",
  "single-day",
  "architects-daughter",
  "dawning-of-a-new-day",
  "satisfy",
  "bahianita",
  "oldenburg",
  "orelega-one",
  "nova-oval",
  "atma",
  "butcherman",
  "cherry-bomb-one",
]);

/** Exact Google Font family names (source of truth for CSS + URL). */
export const FONT_DISPLAY_NAMES: Record<string, string> = {
  serif: "Serif",
  "sans-serif": "Sans-serif",
  monospace: "Monospace",
  abeezee: "ABeeZee",
  aclonica: "Aclonica",
  "advent-pro": "Advent Pro",
  "anonymous-pro": "Anonymous Pro",
  "tenali-ramakrishna": "Tenali Ramakrishna",
  truculenta: "Truculenta",
  "ubuntu-sans-mono": "Ubuntu Sans Mono",
  unbounded: "Unbounded",
  "nova-mono": "Nova Mono",
  orbitron: "Orbitron",
  bahianita: "Bahianita",
  "syne-mono": "Syne Mono",
  vt323: "VT323",
  "xanh-mono": "Xanh Mono",
  "cutive-mono": "Cutive Mono",
  "arbutus-slab": "Arbutus Slab",
  "nixie-one": "Nixie One",
  "noticia-text": "Noticia Text",
  arvo: "Arvo",
  oi: "Oi",
  oldenburg: "Oldenburg",
  "orelega-one": "Orelega One",
  "nova-oval": "Nova Oval",
  atma: "Atma",
  butcherman: "Butcherman",
  "cherry-bomb-one": "Cherry Bomb One",
  "annie-use-your-telescope": "Annie Use Your Telescope",
  "nothing-you-could-do": "Nothing You Could Do",
  "oooh-baby": "Oooh Baby",
  "over-the-rainbow": "Over the Rainbow",
  pangolin: "Pangolin",
  "autour-one": "Autour One",
  "permanent-marker": "Permanent Marker",
  "reenie-beanie": "Reenie Beanie",
  "rock-salt": "Rock Salt",
  schoolbell: "Schoolbell",
  "sedgwick-ave": "Sedgwick Ave",
  "shadows-into-light": "Shadows Into Light",
  "short-stack": "Short Stack",
  "shantell-sans": "Shantell Sans",
  solitreo: "Solitreo",
  "sue-ellen-francisco": "Sue Ellen Francisco",
  sunshiney: "Sunshiney",
  "swanky-and-moo-moo": "Swanky and Moo Moo",
  "the-girl-next-door": "The Girl Next Door",
  tillana: "Tillana",
  unkempt: "Unkempt",
  "waiting-for-the-sunrise": "Waiting for the Sunrise",
  "beth-ellen": "Beth Ellen",
  "homemade-apple": "Homemade Apple",
  zeyada: "Zeyada",
  "cedarville-cursive": "Cedarville Cursive",
  "coming-soon": "Coming Soon",
  "covered-by-your-grace": "Covered By Your Grace",
  "crafty-girls": "Crafty Girls",
  comforter: "Comforter",
  "indie-flower": "Indie Flower",
  "give-you-glory": "Give You Glory",
  oregano: "Oregano",
  "protest-revolution": "Protest Revolution",
  "protest-riot": "Protest Riot",
  rancho: "Rancho",
  sarina: "Sarina",
  "single-day": "Single Day",
  onest: "Onest",
  "architects-daughter": "Architects Daughter",
  "dawning-of-a-new-day": "Dawning of a New Day",
  satisfy: "Satisfy",
  "josefin-sans": "Josefin Sans",
  lato: "Lato",
  "open-sans": "Open Sans",
  raleway: "Raleway",
  montserrat: "Montserrat",
  ubuntu: "Ubuntu",
  gloock: "Gloock",
};

function titleCaseFromSlug(fontKey: string): string {
  return fontKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function genericFamily(fontKey: string): string {
  if (MONO_FONTS.has(fontKey)) return "monospace";
  if (SERIF_FONTS.has(fontKey)) return "serif";
  if (HANDWRITING_FONTS.has(fontKey)) return "cursive";
  return "sans-serif";
}

export function getFontDisplayName(fontKey: string): string {
  return FONT_DISPLAY_NAMES[fontKey] || titleCaseFromSlug(fontKey);
}

/** CSS `font-family` value for the given stickee font key. */
export function getCssFontFamily(fontKey: string): string {
  if (fontKey === "serif") return "Georgia, serif";
  if (fontKey === "sans-serif") return "Arial, sans-serif";
  if (fontKey === "monospace") return '"Courier New", monospace';

  const name = getFontDisplayName(fontKey);
  return `"${name}", ${genericFamily(fontKey)}`;
}

/** Inject a Google Fonts stylesheet for a non-system font (idempotent). */
export function loadGoogleFont(fontKey: string): void {
  if (typeof document === "undefined") return;
  if (SYSTEM_FONTS.has(fontKey)) return;

  const name = getFontDisplayName(fontKey);
  const googleFamily = name.replace(/ /g, "+");
  const existing = document.querySelector(`link[data-stickee-font="${fontKey}"]`);
  if (existing) return;

  // Also skip if an equivalent link is already present
  const existingByHref = document.querySelector(`link[href*="family=${googleFamily}"]`);
  if (existingByHref) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleFamily}&display=swap`;
  link.dataset.stickeeFont = fontKey;
  link.onerror = () => {
    console.warn(`Failed to load font: ${name}`);
  };
  document.head.appendChild(link);
}

/** Apply a font to the app CSS variables and ensure it is loaded. */
export function applyAppFont(fontKey: string): void {
  if (typeof document === "undefined") return;
  loadGoogleFont(fontKey);
  const css = getCssFontFamily(fontKey);
  const root = document.documentElement;
  root.style.setProperty("--font-family-base", css);
  root.style.setProperty("--font-family-handwriting", css);
}

/** Google Fonts stylesheet URL for popup windows / external documents. */
export function getGoogleFontStylesheetUrl(fontKey: string): string | null {
  if (SYSTEM_FONTS.has(fontKey)) return null;
  const name = getFontDisplayName(fontKey);
  return `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
}
