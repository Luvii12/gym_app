---
name: Kinetic Volt
colors:
  surface: '#08141f'
  surface-dim: '#08141f'
  surface-bright: '#2f3a46'
  surface-container-lowest: '#040f19'
  surface-container-low: '#111d27'
  surface-container: '#15212c'
  surface-container-high: '#202b36'
  surface-container-highest: '#2a3642'
  on-surface: '#d8e4f3'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#d8e4f3'
  inverse-on-surface: '#26323d'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#ffb693'
  on-secondary: '#561f00'
  secondary-container: '#fe6b00'
  on-secondary-container: '#572000'
  tertiary: '#ffffff'
  on-tertiary: '#003915'
  tertiary-container: '#6bff8f'
  on-tertiary-container: '#007432'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb693'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#7a3000'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#08141f'
  on-background: '#d8e4f3'
  surface-variant: '#2a3642'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.04em
  headline-xl:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.06em
  metric-numeral:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system embodies high-contrast athletic minimalism engineered specifically for intense, distraction-free environments. The target audience encompasses dedicated lifters, athletes, and fitness enthusiasts who demand zero friction, hyper-legible metrics, and instantaneous one-handed interactions while mid-set. 

The aesthetic is utilitarian, assertive, and meticulously crafted. It rejects unnecessary skeumorphism and decorative fluff in favor of pure operational efficiency, tactical dark surfaces, and razor-sharp typographic hierarchy. High-energy neon accents pierce deep obsidian canvases, triggering an immediate sense of urgency, focus, and momentum without fatiguing the eyes in low-lit gym settings.

## Colors

The palette leverages a dark-mode-first architecture calibrated for low-light legibility and battery efficiency:

- **Canvas & Obsidian Backgrounds:** Backgrounds use `#0C0F12` as the deep base canvas, with secondary containers layered via `#111418`. Pure black (`#000000`) is deliberately avoided to eliminate harsh OLED smearing and preserve layer depth.
- **Surfaces & Cards:** Interactive modules and grouped metrics occupy `#181D24` and `#1F252E`, bound together with razor-thin structural borders (`#28303C`).
- **Primary Accent (Electric Lime):** `#CCFF00` commands active execution states, primary action buttons, active set toggles, and Personal Record (PR) badges. Elements painted in this accent always use dark contrast text (`#0B0F02`) for uncompromised outdoor and fluorescent-light readability.
- **Secondary Accent (Flame Orange):** `#FF6B00` governs countdown timers, rest-clock warnings, streak tallies, and high-intensity alerts.
- **Success & Progression:** `#22C55E` signals verified completions, logged volume targets, and positive trend vectors.
- **Neutrals & Typography Hierarchy:** Primary headers and key metric values render in stark white (`#FFFFFF`). Secondary metrics, metadata, and labels use steel gray (`#8E9AA8`) and muted slate (`#64748B`) to create deep visual breathing room.

## Typography

Typography prioritizes scan speed, instant metric discernment, and zero layout shifting during rapid entry:

- **Font Family:** `Geist` delivers tight geometric terminals, sharp character separation, and a technical demeanor.
- **Tabular Figures Requirement:** All dynamic numerical outputs—including weights, rep counts, timers, rest intervals, and volume tallies—must enforce `font-variant-numeric: tabular-nums`. This prevents container jitter as digits tick upwards or downwards.
- **Scale Hierarchy:** Metric numerals demand prominent scale (`display-lg-mobile` and `metric-numeral`) to remain legible when the phone is mounted or resting on the floor a meter away. Labels use uppercase tracking (`label-sm`, `label-md`) to clearly identify input types (e.g., `KG`, `REPS`, `RPE`) beneath prominent values.

## Layout & Spacing

The layout is built mobile-first around standard 390x844px viewports, optimized for single-handed thumb reach during high physical exertion.

- **Grid & Margins:** A fluid single-column stack on mobile utilizes a `1rem` (16px) margin. Multi-column metric pairings (e.g., Previous vs. Target vs. Actual) use a crisp `0.75rem` (12px) gutter.
- **Ergonomics & Thumb Zones:** Core completion controls, quick-steppers, and set-confirmation buttons occupy the lower 40% of the screen. Critical top-level data scrolls beneath fixed bottom-oriented action anchors.
- **Breakpoints:**
  - `Mobile` (< 640px): Dedicated full-width cards, pinned bottom navigation bar, single-hand tap zones.
  - `Tablet / Web` (≥ 640px): 4-column balanced grid, maximum container constraint of 680px for routine logging to prevent excessive eye scanning.

## Elevation & Depth

Visual separation relies on calibrated surface tonal shifts and low-contrast perimeter lines rather than heavy blurry drop-shadows, which look muddy on dark backgrounds:

- **Level 0 (Canvas):** `#0C0F12`, flat, recessive background.
- **Level 1 (Structural Cards & Sections):** `#181D24` surface with a crisp `1px` border of `#28303C`.
- **Level 2 (Active Exercise & Stepper Rows):** `#1F252E` surface with a `1px` border of `#364152`. Gives prominent cards visual priority.
- **Level 3 (Modals, Overlays, Floating Timers):** `#181D24` with a subtle diffuse glow: `0px 8px 32px rgba(0, 0, 0, 0.65)` and a sharp `1px` rim border tinted with 15% electric lime (`rgba(204, 255, 0, 0.15)`).

## Shapes

The design system utilizes roundedness level 2, generating a muscular, tactile feel that offsets the stark industrial palette:

- **Cards & Primary Modules:** Employ `rounded-lg` (16px / 1rem) to frame exercise sets cleanly without pinching internal content.
- **Action Buttons & Chips:** Utilize `rounded-md` (12px / 0.75rem) to `rounded-lg` (16px) to maximize the inner clickable area.
- **Pill Badges:** Personal records, rest timer tags, and status chips apply full pill radiuses (`rounded-full` / 9999px) to contrast against rectilinear card blocks.

## Components

### Buttons & Interactive Steppers
- **Primary Action (Log / Finish Routine):** Solid electric lime (`#CCFF00`) with high-contrast text (`#0B0F02`), font-weight 700. Minimum height is 52px to ensure an expansive touch target. Pressed states compress slightly (`scale(0.98)`).
- **Secondary Stepper (+ / - Reps or Weight):** Square 48x48px target on `#1F252E` background with a `#28303C` border and white iconography. Provides active haptic feedback.

### Exercise Set Rows & Checkboxes
- **Set Row Architecture:** Displays set index, target load/reps, and completion toggle in a single 56px-tall horizontal row.
- **Completion Checkbox:** 44x44px target zone. In default state, presents a 2px stroke outline in `#364152`. Upon tap, animates into a filled electric lime (`#CCFF00`) square with an obsidian checkmark (`#0B0F02`).
- **Completed State Feedback:** The entire corresponding set row drops to 50% opacity, and numerical data receives a subtle muted strike-through in `#64748B`.

### Input Fields (Weight & Rep Entry)
- Large tabular-numeral inputs enclosed within `#111418` wells.
- Active focus state replaces the border with a crisp 1px electric lime (`#CCFF00`) glow, automatically selecting existing values for rapid overwrite via custom number pads.

### Cards & Routine Containers
- Constructed on `#181D24` with a 1px border (`#28303C`).
- Header regions cleanly display exercise title, equipment tag, and historical PR badges.

### Bottom Navigation Bar (PWA Dock)
- Fixed bottom dock at 68px height (plus safe-area padding).
- Surface: Frosted obsidian (`#0C0F12` at 92% opacity with `backdrop-filter: blur(16px)`), bordered by a 1px top divider (`#1F252E`).
- 4 Tabs: *Hoy* (Flame), *Rutinas* (Layers), *Ejercicios* (Dumbbell), *Progreso* (Trend Line).
- Inactive tabs display `#64748B`; active tab transitions to `#CCFF00` with an active indicator dot beneath the icon.

### Rest Timer Floating Banner
- Docked directly above the navigation bar during active rest periods.
- Features a glowing `#FF6B00` linear progress bar across its top rim, accompanied by high-visibility countdown numerals in `tabular-nums`.