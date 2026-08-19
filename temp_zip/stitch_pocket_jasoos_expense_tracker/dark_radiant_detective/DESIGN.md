---
name: Dark Radiant Detective
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#d4c0d7'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#9d8ba0'
  outline-variant: '#514255'
  surface-tint: '#ecb2ff'
  primary: '#ecb2ff'
  on-primary: '#520071'
  primary-container: '#bd00ff'
  on-primary-container: '#ffffff'
  inverse-primary: '#9900cf'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#ffb59a'
  on-tertiary: '#5a1b00'
  tertiary-container: '#cf4900'
  on-tertiary-container: '#fffeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f8d8ff'
  primary-fixed-dim: '#ecb2ff'
  on-primary-fixed: '#320047'
  on-primary-fixed-variant: '#74009f'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#802a00'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1200px
---

## Brand & Style

This design system blends the precision of a high-tech financial dashboard with the approachable, narrative-driven charm of a personal journal. The personality is "The Financial Detective"—insightful, sharp, and investigative, yet deeply human and relatable. 

The aesthetic is a hybrid of **Glassmorphism** and **High-Contrast Modern**. It utilizes deep obsidian surfaces to create a sense of mystery and focus, while radiant neon accents act as "clues" that guide the user through their spending habits. To soften the technical edge, hand-drawn "doodle" style icons and sketchy underline accents are integrated, mirroring the relatable struggle of managing money shown in the reference imagery. The result is a UI that feels like a professional tool for a smart, modern investigator of their own life.

## Colors

The palette is built on a foundation of "Obsidian" and "Deep Charcoal" to minimize eye strain and maximize the pop of functional colors.

- **Primary (Electric Purple):** Used for primary actions, branding, and high-level summaries. It represents the "detective's intuition."
- **Secondary (Neon Cyan):** Used for inflows, savings, and positive financial trends. It feels digital and "solved."
- **Tertiary (Sunset Orange):** Reserved for alerts, over-budget warnings, and essential outflows. It demands attention without the harshness of pure red.
- **Accents:** High-vibrancy gradients between these colors are used for data visualization and "radiant" glass effects.
- **Surface:** Backgrounds use a true obsidian (#0A0A0B), while cards use a slightly lighter charcoal (#161618) with varying levels of transparency.

## Typography

The typography system strikes a balance between geometric authority and utilitarian clarity. **Montserrat** provides a bold, confident voice for headlines, reinforcing the "professional detective" persona. **Inter** handles the heavy lifting for data-dense tables and body text, ensuring maximum readability at small sizes.

For a unique stylistic touch, occasional "handwritten" annotations (using a secondary script font or SVG paths) may be used to highlight specific data points, mimicking the notebook style of the reference image.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high internal density for data tables but generous margins for structural elements. 

- **Desktop:** 12-column grid with 24px gutters. Content is centered with a max-width of 1200px.
- **Mobile:** Single column with 16px margins.
- **Spacing Rhythm:** Based on an 8px base unit. Component padding should prioritize a "breathable" feel to offset the dark, heavy background colors. 
- **Glass Containers:** Use consistent internal padding (24px or 32px) to ensure the frosted glass effect has enough "clear air" to feel premium.

## Elevation & Depth

Depth is achieved through **Glassmorphism** rather than traditional drop shadows. This creates a "multi-layered investigation board" feel.

- **Level 1 (Base):** Obsidian background (#0A0A0B).
- **Level 2 (Cards):** Semi-transparent charcoal (#18181B at 60% opacity) with a 20px Backdrop Blur and a subtle 1px border (white at 10% opacity) to simulate a glass edge.
- **Level 3 (Modals/Popovers):** Higher opacity (80%) and a radiant outer glow using the Primary color (Purple) at very low opacity (15%) to signify active focus.
- **Data Points:** Individual transaction items use a flat, low-contrast outline to remain legible without cluttering the depth map.

## Shapes

The design system uses a **Rounded** shape language to feel modern and friendly. 

- Standard components (Buttons, Inputs) use a 0.5rem (8px) radius.
- Feature cards and Glassmorphic containers use a 1rem (16px) radius to feel more like "objects" on the screen.
- Icons should follow a slightly rounded aesthetic, but include "sketchy" or hand-drawn flourishes (like uneven line weights) for specific category markers to maintain the relatable vibe.

## Components

- **Buttons:** Primary buttons use a vibrant Purple-to-Cyan gradient with white text. Ghost buttons use the 1px white border at 20% opacity.
- **Glass Cards:** The signature container. Includes a subtle "inner glow" on the top-left edge to enhance the glass effect.
- **Chips (Category Tags):** High-contrast background colors corresponding to the category (e.g., Orange for "Food", Purple for "Entertainment") with a slightly "bubbly" shape.
- **Input Fields:** Darker than the card background, using the Secondary (Cyan) color for the focus border.
- **Data Visualizations:** Use "Radiant" gradients. Don't use flat colors for charts; use glows and blurs to make the data feel "alive."
- **Detective "Clue" Tooltips:** Use hand-drawn arrow icons and a casual font to provide helpful tips or insights on spending patterns.