---
name: Chartreuse & Charcoal Editorial
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
  secondary: '#5e5e62'
  on-secondary: '#ffffff'
  secondary-container: '#e3e2e6'
  on-secondary-container: '#646468'
  tertiary: '#546500'
  on-tertiary: '#ffffff'
  tertiary-container: '#cdf31c'
  on-tertiary-container: '#5a6c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7ed6e'
  primary-fixed-dim: '#bbd155'
  on-primary-fixed: '#181e00'
  on-primary-fixed-variant: '#404c00'
  secondary-fixed: '#e3e2e6'
  secondary-fixed-dim: '#c7c6ca'
  on-secondary-fixed: '#1b1b1f'
  on-secondary-fixed-variant: '#46464a'
  tertiary-fixed: '#ccf21a'
  tertiary-fixed-dim: '#b2d400'
  on-tertiary-fixed: '#181e00'
  on-tertiary-fixed-variant: '#3f4c00'
  background: '#f9f9fd'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e6'
  surface-cream: '#FBF9F4'
  surface-ivory: '#F5F3EC'
  surface-pure: '#FFFFFF'
  charcoal-deep: '#121316'
  charcoal-muted: '#1C1E21'
  electric-chartreuse: '#D2F824'
  soft-lime: '#D8EE6F'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 54px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
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
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses an energetic yet refined editorial aesthetic centered on striking color contrast, tactile pebble geometry, and crisp typography. The brand identity fuses avant-garde editorial publishing with approachable modern product design, cultivating feelings of forward motion, precision, and unpretentious sophistication.

The style synthesizes **Minimalism** with **High-Contrast Modernism**:
- **Strict Chromatic Discipline**: High-frequency energy is focused entirely through electric chartreuse, grounded by deep charcoal and cushioned by warm ivory surfaces. Every extraneous hue—especially blues, purples, and cool pastels—is eliminated.
- **Ultra-Rounded Pebble Architecture**: Geometry is consistently softened with deep radii and continuous pill silhouettes, counterbalancing the high-contrast color scheme with an organic, friendly rhythm.
- **Editorial Typography**: Confident display scale, tight negative tracking on titles, and generous body breathing room evoke high-fashion print layouts and bespoke modern editorial experiences.

## Colors

The color system enforces a zero-tolerance rule against all cool spectrum tones—purples, lavenders, lilacs, indigos, and blues are completely excluded. The palette is strictly bounded to three chromatic families:

- **Soft Lime & Electric Chartreuse (`#D8EE6F` / `#D2F824`)**: Acts as the focal brand charge. `#D8EE6F` provides a balanced base for buttons, containers, and highlights, while `#D2F824` is reserved for micro-accents, interactive indicators, and active badges.
- **Deep Black & Dark Charcoal (`#121316` / `#1C1E21`)**: Serves as the primary structural color. Typography, prominent CTA surfaces, and primary icon treatments rely on this dark ground for razor-sharp visual contrast.
- **Warm Ivory & Soft Cream (`#FBF9F4`, `#F5F3EC`, `#FFFFFF`)**: Forms the multi-tier neutral canvas. `#FBF9F4` is the default page backdrop, `#F5F3EC` provides subtle component grouping, and `#FFFFFF` provides punchy island container surfaces.

### Color Rules
- **Text on Bright Accents**: All typography placed over `#D8EE6F` or `#D2F824` must strictly use `#121316`. White text on lime is never permitted.
- **Secondary States & Inactive Content**: Hierarchy is achieved strictly through alpha reduction of `#1C1E21` (e.g., 60% for secondary labels, 35% for placeholders or muted items) rather than introducing cool or tinted gray tones.
- **Borders & Dividers**: Structural lines utilize `#121316` at 8% to 15% opacity against cream surfaces.

## Typography

The type system is powered by **Plus Jakarta Sans**, chosen for its crisp geometric letterforms, open counters, and warm, contemporary punch. It pairs seamlessly with ultra-rounded UI elements to deliver a modern, magazine-level polish.

- **Weight Contrasts**: Headlines intentionally utilize heavy weight anchors (700 and 800) with compressed line heights and tight negative tracking. In editorial lockups, emphasized keywords switch between full black and muted charcoal to generate dynamic cadence.
- **Body Clarity**: Body text remains clean, neutral, and readable with relaxed line heights that contrast the dense weight of the headlines.
- **Mobile Responsive Scale**: Headers drop smoothly across mobile viewports via `-mobile` tokens to prevent excessive wrapping on smaller displays.

## Layout & Spacing

The layout is structured around an adaptable 8pt proportional grid with intentional editorial whitespace:
- **Mobile (< 768px)**: 4-column fluid layout with `1.25rem` outer margins and `1rem` column gutters. Large hero containers span edge-to-edge with pill-shaped internal insets.
- **Tablet (768px - 1024px)**: 8-column layout with `2rem` margins and `1.25rem` gutters.
- **Desktop (> 1024px)**: 12-column layout maxing out at `1240px` total width, centered within the viewport.

Spacing tokens dictate rhythm:
- `space-xs` (4px) and `space-sm` (8px) govern micro-interactions, badge insets, and icon-text pairings.
- `space-md` (16px) defines input padding and standard card interiors.
- `space-lg` (24px) and `space-xl` (40px) control block divisions, card gaps, and hero section breathing room.

## Elevation & Depth

This design system avoids heavy shadows, gradient bevels, and artificial skeuomorphic lighting. Depth is articulated entirely through **Tonal Layering** and **Graphic Flat Stacking**:

- **Surface Progression**: Depth is communicated by nesting high-contrast flat planes: base page `#FBF9F4` holds secondary sections in `#F5F3EC`, while interactive cards sit on crisp `#FFFFFF` or bold `#D8EE6F`.
- **Low-Contrast Ghost Outlines**: Floating cards, sheets, and dialogs are grounded by razor-thin borders: `1px solid rgba(18, 19, 22, 0.08)`.
- **Minimal Ambient Floor**: Where elevation is essential for floating navigation bars or bottom sheets, a soft, wide-spread charcoal shadow is applied without any color tint:
  `box-shadow: 0 16px 40px -12px rgba(18, 19, 22, 0.06)`.

## Shapes

The shape language is strictly **Pill and Pebble** (`ROUND_FULL` / level 3). Angular box shapes are avoided in favor of friendly, sweeping curves:

- **Buttons, Inputs, & Tags**: Always utilize `border-radius: 9999px` (full continuous pill).
- **Cards & Primary Modules**: Minimum corner radius is `2rem` (32px), scaling up to `3rem` (48px) for large hero feature boxes to create a distinct, touch-friendly pebble impression.
- **Avatars & Media Frames**: Cropped inside full circular or pill-shaped masks.

## Components

### Buttons
- **Primary Button**: Full pill geometry (`rounded-full`), filled with `#121316`, white `#FFFFFF` text, paired with `label-md` or `label-lg`. Padding: `0.875rem 2rem`. On hover, transitions cleanly into `#D8EE6F` background with `#121316` text.
- **Accent Button**: Full pill geometry, background `#D8EE6F` with text `#121316`. Active state shifts to `#D2F824` with a subtle `scale(0.98)` spring feel.
- **Subtle / Ghost Button**: Full pill outline with `1.5px solid rgba(18, 19, 22, 0.15)`, text in `#121316`. Hover state fills with `#F5F3EC`.

### Chips & Badges
- **Category Chips**: Full pill shape with `0.5rem 1.25rem` padding. Default state: `#F5F3EC` fill with `#121316` text at 70% opacity. Active/Selected state: Solid `#D8EE6F` or `#121316` with 100% contrasting typography.
- **Status Badges**: Ultra-compact pills (`0.25rem 0.75rem`) featuring uppercase `label-sm`. Accent alert points use `#D2F824` glowing indicators.

### Cards
- **Base Container**: Pebble radius (`2rem` / 32px), background `#FFFFFF`, padded with `space-lg`. Edge definition provided by a `1px` stroke in `rgba(18, 19, 22, 0.07)`.
- **Editorial Spotlight Card**: Background in `#D8EE6F` or `#F5F3EC`, headline typography in `#121316` (`headline-lg`), with pill tags nested in top-right corners.

### Form Inputs
- **Text Fields**: Full pill container (`9999px` radius), height `52px`, horizontal padding `1.5rem`. Surface is `#FFFFFF` with a `1px` border of `rgba(18, 19, 22, 0.12)`. Placeholder text sits at 40% charcoal opacity.
- **Focused State**: Border shifts to crisp `#121316` accompanied by a subtle `3px` focus ring in `#D8EE6F`.

### Checkboxes & Radio Buttons
- **Radio Buttons**: Concentric circles with deep black outer rim and `#D8EE6F` inner indicator disk when active.
- **Checkboxes**: Soft-pebble rounded squares (`rounded-lg` / 8px) with `#121316` background and stark white/lime checkmarks when selected.

### Navigation Bars & Segmented Controls
- **Floating Island Bar**: Full pill container pinned above viewport bottom, background `#121316` at 95% opacity with subtle backdrop blur, housing `#D8EE6F` active icons and indicators.
- **Segmented Switcher**: Pill-shaped track in `#F5F3EC` containing an active sliding pebble slider in `#FFFFFF` or `#D8EE6F` with an elevation-tinted shadow.