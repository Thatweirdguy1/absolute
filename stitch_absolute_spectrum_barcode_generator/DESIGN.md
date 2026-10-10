---
name: Spectrum
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393e'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b20'
  surface-container: '#1f1f24'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343439'
  on-surface: '#e3e2e8'
  on-surface-variant: '#b9cbbd'
  inverse-surface: '#e3e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#849588'
  outline-variant: '#3a4a3f'
  surface-tint: '#00e290'
  primary: '#f5fff5'
  on-primary: '#003920'
  primary-container: '#00ffa3'
  on-primary-container: '#007146'
  inverse-primary: '#006d43'
  secondary: '#dbb8ff'
  on-secondary: '#470083'
  secondary-container: '#6807ba'
  on-secondary-container: '#d0a6ff'
  tertiary: '#fffbff'
  on-tertiary: '#66002c'
  tertiary-container: '#ffd5dd'
  on-tertiary-container: '#c3005b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#52ffac'
  primary-fixed-dim: '#00e290'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005231'
  secondary-fixed: '#efdbff'
  secondary-fixed-dim: '#dbb8ff'
  on-secondary-fixed: '#2b0052'
  on-secondary-fixed-variant: '#6600b7'
  tertiary-fixed: '#ffd9e0'
  tertiary-fixed-dim: '#ffb1c3'
  on-tertiary-fixed: '#3f0019'
  on-tertiary-fixed-variant: '#8f0041'
  background: '#121317'
  on-background: '#e3e2e8'
  surface-variant: '#343439'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Space Mono
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Space Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system channels the hypnotic tension between vintage analog celluloid and precision optical instrumentation. Rooted in cinematic preservation and experimental film analysis, it synthesizes retro-futuristic CRT scanline textures with liquid-smooth modern dark interfaces.

The emotional tone is nocturnal, high-tech, and reverent toward cinema: a digital darkroom meets an anamorphic editing bay. Surfaces remain submerged in abyss-black tones, punctuated by searing phosphor emissive accents and prismatic slit-scan streaks extracted from motion picture timelines.

Key styling principles:
- **Phosphor Luminance**: Interactive anchors and active states beam with focused high-frequency luminescence reminiscent of laboratory P1-phosphor oscilloscopes.
- **Prismatic Dispersion**: Multi-colored movie barcode gradients are treated as rare spectral artifacts, strictly reserved for data visualization, playback heads, and asset headers.
- **Optical Glass & Substrates**: Translucent black glass substrates provide layering without visual clutter, allowing high-density frame timelines to glow through underlays.

## Colors

The palette establishes an obsidian canvas where cinema hues take absolute dominance.

- **Primary (`#00FFA3`)**: P1 Phosphor Neon. Utilized for critical state indicators, transport controls, timeline tracking heads, and precision readouts.
- **Secondary (`#7928CA`) & Tertiary (`#FF007A`)**: Anamorphic Flare Violet & Halation Magenta. Applied in continuous gradient spectrums along with spectral cyan and gold to depict slit-scan chronologies and dynamic barcode extraction ribbons.
- **Neutral Canvas (`#0B0C10`)**: Celluloid Obsidian. Serves as base darkness, accompanied by `#141721` for elevated surface containers and `#1E2333` for interactive borders.

Color rules:
- Emissive glow passes must use pure `#00FFA3` with a 20% alpha spread to simulate CRT screen bleed.
- Never use solid white for primary typography; rely on `#E6EDF3` (90% light value) to prevent optic fatigue on OLED mobile displays.
- Spectrum gradients must simulate continuous slit-scan exposure across time slices rather than decorative pastel blends.

## Typography

The typographic hierarchy blends laboratory instrument readouts with sleek architectural sans-serifs.

- **Headlines & Titles**: Space Grotesk injects geometric tension, wide horizontal forms, and mechanical curves that reflect mid-century film reels and widescreen display formats.
- **Body & Long-form**: Geist preserves crystal-clear micro-legibility within dense dark panels, metadata inspectors, and export settings.
- **Telemetry, Timecodes, & Readouts**: Space Mono delivers fixed-width discipline to frame counters, FPS rates, color hex matrices, and aspect-ratio indicators. All timecode displays must enforce tabular alignment.

## Layout & Spacing

Designed primarily for single-handed mobile precision workflows with landscape media inspection allowances:

- **Mobile Canvas**: A 4-column fluid layout with tight 16px margins and 12px gutters, maximizing the vertical scan area for generated film barcode strips.
- **Safe Area Adaptations**: Top app bars accommodate dynamic island hardware cutouts with an automatic 48px baseline safe margin. Bottom navigation and export docks anchor with 24px vertical padding above gesture home bars.
- **Density Control**: Inspector sheets and metadata ribbons employ compact internal gaps (`space-xs` to `space-sm`) to emulate specialized cinema grading desks.
- **Expanded Tablet / Desktop Layout**: Scales to a dual-pane 8-column or 12-column split view where the movie barcode viewport remains locked at cinematic aspect ratios (2.39:1 / 1.85:1) while controls dock to persistent glass sidebars.

## Elevation & Depth

Visual hierarchy leverages dark optical physics rather than standard drop shadows.

- **Surface 0 (Canvas)**: `#0B0C10` matte substrate.
- **Surface 1 (Base Cards & Timeline Wells)**: `#12151C` with a 1px border of `rgba(255, 255, 255, 0.06)`.
- **Surface 2 (Floating Trays & Modals)**: Frosted glass panels using `rgba(18, 21, 28, 0.75)` combined with a `24px` backdrop blur and an inner perimeter highlight of `inset 0 1px 0 rgba(255, 255, 255, 0.12)`.
- **Emissive State Elevation**: Active scrubbers and primary actions cast an inner and outer luminescent discharge: `0 0 16px rgba(0, 255, 163, 0.35)`.
- **CRT Scanline Layering**: Subtle scanline overlays (`background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)`) sit between background panels and high-priority chrome to heighten filmic texture.

## Shapes

The interface balances sharp industrial angles with restrained corner softening:

- **Soft Contours (`roundedness: 1`)**: Base UI structures employ a controlled 4px radius (`space-xs`) on chips and indicators, transitioning to 8px (`space-sm`) on cards and modal panels.
- **Chiseled Apertures**: Barcode preview viewports and media scrubbers remain hard-edged (0px radius) to maintain fidelity with raw uncropped celluloid frames and slit-scan outputs.
- **Segmented Controls**: Feature buttons snap to tight, rectangular geometries to mirror vintage broadcast monitor hardware switches.

## Components

- **Buttons**:
  - *Primary Phosphor*: Solid `#00FFA3` surface with pitch `#0B0C10` Space Mono typography. Emits a calibrated glow on press.
  - *Secondary Glass*: Translucent `rgba(255, 255, 255, 0.05)` fill with a 1px `rgba(255, 255, 255, 0.15)` border and neon phosphor hover transitions.
  - *Film Transport Button*: Compact square icon button with hairline borders, triggering instantaneous tactile haptic feedback.

- **Barcode Spectrum Strip (Hero Component)**:
  - An edge-to-edge slit-scan visualization container with a movable needle-thin phosphor tracking scrubber.
  - Features real-time frame magnification in an elevated picture-in-picture glass loupe when touched.

- **Chips & Filter Pills**:
  - Low-profile 24px height tags with Space Mono labels. Inactive states rest at 10% opacity white; active states lock to dark obsidian with a vibrant `#00FFA3` hairline border and matching text.

- **Input Fields & Sliders**:
  - Slider tracks render as fine 2px hairline rails. The thumb is a vertical rectangular optical cursor illuminated in `#00FFA3`.
  - Numeric input fields strictly enforce monospaced styling with integrated frame-step incrementers (`-1F`, `+1F`).

- **Cards & Data Panels**:
  - Backed by Surface 1 obsidian glass, featuring top-edge lighting rules and embedded technical metadata headers (e.g., `RES: 4K // FPS: 23.976 // SLIT: 1PX`).

- **Checkboxes & Toggle Switches**:
  - Micro-toggles modeled after mechanical avionics dip-switches: when toggled on, the inner pin illuminates in solid phosphor green with a subtle cathode-ray blooming effect.
