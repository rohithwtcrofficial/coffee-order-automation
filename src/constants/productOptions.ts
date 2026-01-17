/* ============================
   Category Options & Labels
============================ */

export const categoryOptions = [
  { value: 'COFFEE_BEANS', label: 'Coffee Beans' },
  { value: 'FILTER_COFFEE', label: 'Filter Coffee' },
  { value: 'INSTANT_COFFEE', label: 'Instant Coffee' },
  { value: 'TEA', label: 'Tea' },
] as const;

export const CATEGORY_LABEL_MAP: Record<string, string> = {
  COFFEE_BEANS: 'Coffee Beans',
  FILTER_COFFEE: 'Filter Coffee',
  INSTANT_COFFEE: 'Instant Coffee',
  TEA: 'Tea',
};

/* ============================
   Roast Level Options & Labels
============================ */

export const roastLevelOptions = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LIGHT_MEDIUM', label: 'Light Medium' },
  { value: 'MEDIUM_DARK', label: 'Medium Dark' },
  { value: 'DARK', label: 'Dark' },
] as const;

export const ROAST_LABEL_MAP: Record<string, string> = {
  LIGHT: 'Light',
  MEDIUM: 'Medium',
  LIGHT_MEDIUM: 'Light Medium',
  MEDIUM_DARK: 'Medium Dark',
  DARK: 'Dark',
};

/* ============================
   Derived Types (Optional)
============================ */

export type CategoryValue =
  typeof categoryOptions[number]['value'];

export type RoastLevelValue =
  typeof roastLevelOptions[number]['value'];
