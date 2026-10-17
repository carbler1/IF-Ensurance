# If Life Partner: colour palette

Source: the If design system (IDS) CSS on https://www.if-insurance.com/about-if/about-us, read 2026-10-17. All hex values below come from IDS primitive tokens. The roles are our choice.

## 1. Character

- The page is a warm beige, not white. White is for cards that sit on top of it.
- Text is a dark brown, not black.
- One strong blue carries every action. Use it only for things the user can press, and for score progress.
- Green, yellow and red are only for status. Do not use them as decoration.

## 2. Core palette

| Role | Hex | IDS source | Use |
|---|---|---|---|
| Page background | `#F6F3F0` | neutral-200 | App background behind all content |
| Surface | `#FFFFFF` | white | Cards, sheets, the bottom tab bar |
| Surface raised | `#FAF9F7` | neutral-100 | Inputs, nested panels |
| Surface muted | `#F1ECE8` | neutral-300 | Pressed cards, quiet sections |
| Border | `#E8E0D9` | neutral-500 | Card and divider lines, score ring track |
| Border strong | `#D6CEC8` | neutral-600 | Input borders |
| Text | `#331E11` | neutral-1000 | Body text and headings |
| Text muted | `#6E625E` | neutral-900 | Secondary text, captions |
| Text disabled | `#9F948F` | neutral-800 | Disabled labels only. It fails contrast for real text. |
| Primary | `#0054F0` | blue-400 | Buttons, links, active tab, score fill |
| Primary pressed | `#1241A2` | blue-500 | Hover and pressed state |
| Primary tint | `#E1E9F6` | blue-100 | Selected rows, info alerts, chips |
| Primary soft | `#A8C2F0` | blue-200 | Primary on dark backgrounds |
| Inverted background | `#24150C` | neutral-1100 | Score-up celebration sheet, toasts |
| Inverted text | `#FAF9F7` | neutral-100 | Text on primary, danger and inverted backgrounds |

## 3. Status

| Status | Strong (text, icon) | Background | Use |
|---|---|---|---|
| Success | `#217331` green-400 | `#E0F0DB` green-100 | Job confirmed by partner, score gain |
| Warning | `#24150C` text on `#FCC74F` yellow-400 badge | `#F9EBC7` yellow-100 | Due soon, weather alert |
| Danger | `#BB320C` red-400 (pressed `#812308`) | `#F9E3D4` red-100 | High-priority risk, missed maintenance, score loss |
| Info | `#1241A2` blue-500 | `#E1E9F6` blue-100 | Tips, neutral notices |

Never put yellow text on a light background. On white it has a contrast ratio of 2.0:1.

## 4. Care Score tiers

All four tier colours come from the IDS palette. Show each tier as a coloured dot or ring accent next to the tier name. Do not use the tier colour alone to carry meaning.

| Tier | Colour | IDS source |
|---|---|---|
| Bronze | `#D16547` | red-300 |
| Silver | `#9F948F` | neutral-800 |
| Gold | `#E9AD25` | yellow-500 |
| Platinum | `#0054F0` | blue-400 |

Score ring: track `#E8E0D9`, fill `#0054F0`.

## 5. Contrast checks (WCAG 2.1)

| Pair | Ratio | Result |
|---|---|---|
| Text on page background | 14.2:1 | AAA |
| Text muted on page background | 5.3:1 | AA |
| Primary on page background | 5.4:1 | AA |
| Inverted text on primary | 5.7:1 | AA |
| Inverted text on primary pressed | 8.7:1 | AAA |
| Success on success background | 5.0:1 | AA |
| Danger on white | 5.9:1 | AA |
| Inverted text on danger | 5.6:1 | AA |
| Warning text on yellow-400 badge | 11.3:1 | AAA |
| Text disabled on page background | 2.7:1 | Fails. Disabled only. |
| Bronze on white | 3.7:1 | Graphics and large text only |
| Gold on white | 2.0:1 | Graphics only, never text |

## 6. Tokens for shadcn/ui (Tailwind)

Paste this into `src/index.css`. The values are HSL triplets, the format that Lovable's shadcn setup uses.

```css
@layer base {
  :root {
    --background: 30 25% 95%;          /* #F6F3F0 */
    --foreground: 23 50% 13%;          /* #331E11 */
    --card: 0 0% 100%;                 /* #FFFFFF */
    --card-foreground: 23 50% 13%;
    --popover: 0 0% 100%;
    --popover-foreground: 23 50% 13%;
    --primary: 219 100% 47%;           /* #0054F0 */
    --primary-foreground: 40 23% 97%;  /* #FAF9F7 */
    --secondary: 27 24% 93%;           /* #F1ECE8 */
    --secondary-foreground: 23 50% 13%;
    --muted: 27 24% 93%;               /* #F1ECE8 */
    --muted-foreground: 15 8% 40%;     /* #6E625E */
    --accent: 217 54% 92%;             /* #E1E9F6 */
    --accent-foreground: 220 80% 35%;  /* #1241A2 */
    --destructive: 13 88% 39%;         /* #BB320C */
    --destructive-foreground: 40 23% 97%;
    --border: 28 25% 88%;              /* #E8E0D9 */
    --input: 26 15% 81%;               /* #D6CEC8 */
    --ring: 219 100% 47%;              /* #0054F0 */
    --radius: 0.75rem;

    --success: 132 55% 29%;            /* #217331 */
    --success-soft: 106 41% 90%;       /* #E0F0DB */
    --warning: 42 97% 65%;             /* #FCC74F */
    --warning-soft: 43 81% 88%;        /* #F9EBC7 */
    --danger-soft: 24 76% 90%;         /* #F9E3D4 */
    --inverted: 22 50% 9%;             /* #24150C */

    --tier-bronze: 13 60% 55%;         /* #D16547 */
    --tier-silver: 19 8% 59%;          /* #9F948F */
    --tier-gold: 42 82% 53%;           /* #E9AD25 */
    --tier-platinum: 219 100% 47%;     /* #0054F0 */
  }
}
```

## 7. Not included

- Dark mode. The If site has no dark theme to draw from.
- The If typeface ("If Sans") and the If logo. Both are If property. The prototype uses neither.
