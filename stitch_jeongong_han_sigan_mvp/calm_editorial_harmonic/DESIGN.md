---
name: Calm Editorial Harmonic
colors:
  surface: '#f9f9fd'
  surface-dim: '#d9dade'
  surface-bright: '#f9f9fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f7'
  surface-container: '#ededf1'
  surface-container-high: '#e8e8ec'
  surface-container-highest: '#e2e2e6'
  on-surface: '#1a1c1f'
  on-surface-variant: '#464838'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f0f0f4'
  outline: '#777966'
  outline-variant: '#c7c8b2'
  surface-tint: '#566500'
  primary: '#566500'
  on-primary: '#ffffff'
  primary-container: '#d8ee6f'
  on-primary-container: '#5c6c00'
  inverse-primary: '#bbd155'
  secondary: '#5d51ae'
  on-secondary: '#ffffff'
  secondary-container: '#a89cff'
  on-secondary-container: '#3b2e8b'
  tertiary: '#615e59'
  on-tertiary: '#ffffff'
  tertiary-container: '#e8e2db'
  on-tertiary-container: '#67645f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7ed6e'
  primary-fixed-dim: '#bbd155'
  on-primary-fixed: '#181e00'
  on-primary-fixed-variant: '#404c00'
  secondary-fixed: '#e5deff'
  secondary-fixed-dim: '#c8bfff'
  on-secondary-fixed: '#180064'
  on-secondary-fixed-variant: '#453895'
  tertiary-fixed: '#e7e2db'
  tertiary-fixed-dim: '#cbc6bf'
  on-tertiary-fixed: '#1d1b17'
  on-tertiary-fixed-variant: '#494642'
  background: '#f9f9fd'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embraces an elevated, calm, and contemporary editorial aesthetic rooted in modern culinary and lifestyle sensibilities. The brand evokes feelings of clarity, mindful engagement, and effortless warmth. By pairing generous whitespace and expansive fields of warm cream with serene geometric accents, it communicates quiet sophistication and welcoming accessibility.

The style merges **Minimalism** with **Playful Modernism**:
- Heavy use of warm, unadorned surfaces allowing content to breathe.
- Flat graphic geometry—clean circles, semicircles, and soft pill motifs that ground illustrations and structural containers without ornamental noise.
- Restraint over excess: all loud neon saturations, hyper-vibrant blues, and high-intensity alert tones are strictly eliminated in favor of a soft, harmonic two-tone and three-tone balance.
- Tactile simplicity with rounded contours that feel natural, calm, and human-centric.

## Colors

The color system strictly adheres to the editorial, muted palette derived from the visual reference:
- **Primary (`#D8EE6F`)**: A soft chartreuse / lime green. Used as a fresh focal tint, heroic accent blocks, and highlight surfaces.
- **Secondary (`#8E82E3`)**: A gentle, muted lavender / peruvinkle purple. Provides a serene, balanced counter-weight to the chartreuse.
- **Tertiary (`#FDF7F0`)**: A delicate warm off-white / pale cream tone. Used for subtle category badges, tertiary geometric shapes, and gentle interactive states.
- **Neutral (`#1C1E21`)**: A dark charcoal / slate black used for grounded typography and high-contrast iconography.
- **Surface Background (`#FAF9F6`)**: A warm, off-white / light cream canvas that softens screen glare and creates organic warmth.

### Color Rules
- **No loud neon or saturated primary tones**: Vivid royal blues, hot corals, and hyper-saturated greens are strictly prohibited.
- **Surface Hierarchy**: Base layers default to `#FAF9F6`. Large display sections alternate between full-bleed `#FAF9F6`, `#D8EE6F`, and `#8E82E3` backgrounds, relying on `#1C1E21` (or stark white `#FFFFFF` over deep lavender) for legible text hierarchy.
- **Muted States**: Inactive or secondary typography uses `#1C1E21` at 40%–60% opacity rather than introducing arbitrary cool grays.

## Typography

The typography uses **Plus Jakarta Sans** uniformly across display, body, and label roles. Its geometric construction, friendly rounded curves, and generous apertures echo the organic, modern shapes of the visual interface.

- **Weight Contrast**: Hierarchy relies heavily on deliberate font weight shifts. Headlines frequently juxtapose bold/semibold emphasized words with regular or low-opacity weights (as demonstrated in onboarding sequences: "Browse / **Cook** / Time").
- **Spacing and Rhythm**: Tight negative letter spacing is applied to large headlines to keep titles punchy and architectural, while body and label tokens maintain neutral to slightly positive tracking for effortless readability.
- **Mobile Scale**: Large display scales compress seamlessly down to `display-lg-mobile` (34px) to avoid awkward breaks on narrow handheld viewports.

## Layout & Spacing

The layout is built upon an 8pt dynamic fluid rhythm structured around high-breathing margins and deliberate whitespace:
- **Mobile (< 768px)**: 4-column fluid layout with `1.5rem` (`24px`) screen margins and `1rem` gutters. Vertical spacing between thematic blocks is generous (`2.5rem`) to replicate editorial print layouts.
- **Tablet (768px - 1024px)**: 8-column layout with `2rem` outer margins and `1.25rem` gutters.
- **Desktop (> 1024px)**: 12-column layout maxing out at `1200px` content width, centered with automatic side margins.

Content cards and geometric containers honor the inner spacing scale:
- `space-xs` (4px) and `space-sm` (8px) handle micro-alignments, pill badge padding, and icon-to-label gaps.
- `space-md` (16px) defines default card padding and input field internal spacing.
- `space-lg` (24px) and `space-xl` (40px) set component separations, stack groupings, and hero-to-content buffers.

## Elevation & Depth

This design system eschews heavy drop shadows, skeuomorphic bevels, and artificial gloss. Depth is created through **Flat Tonal Layering** and **Color Framing**:
- **Layer Stacking**: Elevated cards sit directly on the `#FAF9F6` surface utilizing either crisp, solid backgrounds (such as `#FFFFFF`, `#D8EE6F`, or `#FDF7F0`) or 1px subtle surface borders tinted to `#1C1E21` at 8% opacity.
- **Ambient Floor Shadows**: Where elevation is functionally mandatory (e.g., floating action buttons or modal sheets), use an ultra-diffused, ambient shadow tinted with charcoal rather than pure black:
  `box-shadow: 0 12px 32px -8px rgba(28, 30, 33, 0.08)`.
- **Z-Index & Overlap**: Natural visual depth is generated by overlapping soft geometric silhouettes (full-circle backdrops and semicircles) behind typography and imagery rather than raising elements via z-height.

## Shapes

The design system is strictly **Pill-shaped and organic** (`roundedness: 3`). 

- **Containers & Cards**: Base cards use `rounded-lg` (2rem / 32px) or `rounded-xl` (3rem / 48px) to reinforce the soft, tactile identity.
- **Interactive Elements**: Buttons, search inputs, tags, and category chips utilize full pill borders (`border-radius: 9999px`).
- **Graphic Shapes**: Graphic illustrations, hero backdrops, and image masks favor pure circles, arched capsules, and half-moon semicircles.

## Components

### Buttons
- **Primary Button**: Full pill radius (`9999px`), background in `#D8EE6F` with `#1C1E21` text (`label-md`). Padding: `0.875rem 1.75rem`. Active state scales subtly (`scale(0.98)`).
- **Secondary Button**: Full pill radius, background in `#8E82E3` with `#FFFFFF` or `#1C1E21` text. 
- **Ghost / Text Button**: Transparent background, text in `#1C1E21` with semi-bold label styling, featuring an underlined pill hover state or smooth opacity shift to 60%.

### Chips & Tags
- Compact pill-shaped pills with horizontal padding (`0.5rem 1rem`).
- Default state: Background `#FAF9F6` with a delicate 1px `#1C1E21` border at 12% opacity.
- Selected state: Solid fill of `#FDF7F0` or `#D8EE6F` with dark charcoal text.

### Cards
- Standard cards feature `2rem` (32px) corner radii, clean `#FFFFFF` or `#FAF9F6` surfaces, and inner padding of `1.5rem`.
- Feature / Callout cards: Full-bleed blocks of `#D8EE6F` or `#8E82E3` with high-contrast `#1C1E21` or `#FFFFFF` typography. Zero box-shadows; separation is strictly chromatic.

### Lists & Navigation
- List items are separated by clean horizontal breaks or contained in floating rounded cards.
- Multi-step or onboarding list selectors emphasize the current active selection by shifting non-active items to 35% charcoal opacity while highlighting the active item in full-weight `#1C1E21`.

### Form Inputs
- Pill-shaped inputs with `9999px` radius, background filled with `#FFFFFF`, and a delicate 1px outline of `#1C1E21` at 15% opacity.
- Focus state: Outline darkens cleanly to `#1C1E21` with a soft chartreuse (`#D8EE6F`) ring halo at 20% opacity.