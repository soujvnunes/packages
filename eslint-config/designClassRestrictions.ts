const anyOf = (parts: string[]): string => `(?:${parts.join('|')})`
const CLASS_START = '(?:^|:)!?'
const CLASS_END = '!?$'
const CLASS_VALUE = '[^\\s!]+'
const SPACING_STEPS = ['0', '4', '8', '12', '16', '24', '40', '64', '104', '168']
const SCALED_UTILITIES = [
  'p[xytrblse]?',
  'm[xytrblse]?',
  'gap(?:-[xy])?',
  'space-[xy]',
  'inset(?:-[xy])?',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
  'w',
  'h',
  'size',
  'min-w',
  'min-h',
  'max-h',
  'basis',
]
const COLOUR_UTILITIES = [
  'bg',
  'text',
  'border',
  'ring',
  'outline',
  'fill',
  'stroke',
  'divide',
  'shadow',
  'from',
  'via',
  'to',
]
const MOTION_UTILITIES = [
  `transition(?:-(?!none${CLASS_END})${CLASS_VALUE})?`,
  `animate-(?!none${CLASS_END})${CLASS_VALUE}`,
  `duration-${CLASS_VALUE}`,
  `ease-${CLASS_VALUE}`,
  `delay-${CLASS_VALUE}`,
]
const STOCK_FONT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '[2-9]xl']
const RESPONSIVE_VARIANTS = '(?:^|:)(?:max-)?(?:sm|md):'
const DARK_VARIANT = '(?:^|:)dark:'
const MOTION_SAFE_VARIANT = '(?:.*:)?motion-safe:'
const MOTION_PATTERN = `^(?!${MOTION_SAFE_VARIANT})(?:.*:)?!?${anyOf(MOTION_UTILITIES)}${CLASS_END}`
const FONT_SIZE_PATTERN = `${CLASS_START}text-${anyOf(STOCK_FONT_SIZES)}(?:/${CLASS_VALUE})?${CLASS_END}`
const OFF_SCALE_PATTERN = `${CLASS_START}-?${anyOf(SCALED_UTILITIES)}-(?!${anyOf(SPACING_STEPS)}${CLASS_END})(?:\\d+(?:\\.\\d+)?|px)${CLASS_END}`
const OPACITY_PATTERN = `${CLASS_START}${anyOf(COLOUR_UTILITIES)}-[a-zA-Z0-9-]+/(?:\\d+(?:\\.\\d+)?|\\[[^\\]\\s]+\\]|\\([^)\\s]+\\))${CLASS_END}`
const MAX_WIDTH_PATTERN = `${CLASS_START}max-w-`
export const designClassRestrictions = ({ dark }: { dark: boolean }) => [
  {
    pattern: RESPONSIVE_VARIANTS,
    message:
      'Use one responsive switch, at `lg:`. Drop the `sm:`, `md:`, `max-sm:` and `max-md:` variants.',
  },
  ...(dark
    ? []
    : [
        {
          pattern: DARK_VARIANT,
          message: 'Avoid the `dark:` variant, or turn dark mode on with `design: { dark: true }`.',
        },
      ]),
  {
    pattern: MOTION_PATTERN,
    message:
      'Put motion behind `motion-safe:` so reduced-motion users get none; only `transition-none` and `animate-none` pass without it.',
  },
  {
    pattern: FONT_SIZE_PATTERN,
    message:
      'Avoid a stock font size (`text-xs` to `text-9xl`); use a type scale alias from the theme.',
  },
  {
    pattern: OFF_SCALE_PATTERN,
    message: `Use a value from the scale (${SPACING_STEPS.join(', ')}); this one is off it. A fraction or a keyword such as \`w-1/2\` or \`w-full\` is fine.`,
  },
  {
    pattern: OPACITY_PATTERN,
    message:
      'Avoid a `/N` modifier on a colour or a text utility; use an alpha colour token or a type scale alias from the theme.',
  },
  {
    pattern: MAX_WIDTH_PATTERN,
    message: 'Avoid `max-w-*`; set the width from the grid columns instead.',
  },
]
