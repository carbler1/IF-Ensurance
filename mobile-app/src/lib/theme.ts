// Design tokens carried over 1:1 from the web prototype's styles.css.
export const colors = {
  background: "#f6f3f0",
  foreground: "#331e11",
  card: "#ffffff",
  primary: "#0054f0",
  primaryForeground: "#faf9f7",
  primaryPressed: "#1241a2",
  primaryLight: "#3b82f6",
  secondary: "#f1ece8",
  secondaryForeground: "#331e11",
  muted: "#f1ece8",
  mutedForeground: "#6e625e",
  accent: "#e1e9f6",
  accentForeground: "#1241a2",
  // The held-press tint on PressCard: primary at 6 %.
  primaryTint: "rgba(0, 84, 240, 0.06)",
  destructive: "#bb320c",
  dangerSoft: "#f9e3d4",
  // "Good news" (discounts, done, verified) is a deep blue, not green: the app speaks in one hue.
  // Deeper than primary so it never reads as a button. 7.5:1 on successSoft, 9:1 on white.
  success: "#1241a2",
  successSoft: "#e1e9f6",
  warning: "#fcc74f",
  warningSoft: "#f9ebc7",
  inverted: "#24150c",
  frame: "#e8e0d9",
  border: "#e8e0d9",
  input: "#d6cec8",
  // Edges that must stay visible (input border, switch off track): 3:1 on card and background, WCAG 1.4.11.
  control: "#928680",
  ring: "#0054f0",
} as const;

export type ColorName = keyof typeof colors;

// Maintenance seasons: warm for autumn and summer, the app's blues for winter and spring. Text-safe on their soft colour.
export const seasonColors = {
  autumn: { solid: "#a8432a", soft: "#f4ddd2" },
  summer: { solid: "#8a5f00", soft: "#f9e8c4" },
} as const;

export const tierColors = {
  bronze: { solid: "#d16547", soft: "#f4ddd2" },
  silver: { solid: "#9f948f", soft: "#e6e1de" },
  gold: { solid: "#e9ad25", soft: "#f9e8c4" },
  platinum: { solid: "#0054f0", soft: "#dbe4fb" },
} as const;

// --radius is 0.75rem; the theme derives the other radii from it.
export const radius = { md: 10, lg: 12, xl: 16, "2xl": 20, full: 9999 } as const;

export const shadows = {
  soft: "0 8px 24px -14px rgba(51, 30, 17, 0.25)",
  button: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
} as const;

// Tailwind font-size / line-height pairs. "body" is the 17px base the body element sets.
export const sizes = {
  xs: [12, 16],
  sm: [14, 20],
  base: [16, 24],
  body: [17, 25.5],
  lg: [18, 28],
  xl: [20, 28],
  "2xl": [24, 32],
  "3xl": [30, 36],
  "5xl": [48, 48],
  "6xl": [60, 60],
  "7xl": [72, 72],
} as const;

export type SizeName = keyof typeof sizes;
export type Weight = 400 | 500 | 600 | 700;

const sans: Record<Weight, string> = {
  400: "Figtree_400Regular",
  500: "Figtree_500Medium",
  600: "Figtree_600SemiBold",
  700: "Figtree_700Bold",
};

// The display face loads one weight only: every heading and big number is SemiBold, and the italic serif now
// lives in the logo image. Fewer font files means a shorter splash screen.
export function fontFamily(display: boolean, weight: Weight) {
  return display ? "Fraunces_600SemiBold" : sans[weight];
}
