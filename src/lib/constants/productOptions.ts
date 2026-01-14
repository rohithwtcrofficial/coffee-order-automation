// src/lib/constants/productOptions.ts

/* =======================
   CATEGORY
======================= */

export const CATEGORY_OPTIONS = [
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

/* =======================
   ROAST LEVEL
======================= */

export const ROAST_LEVEL_OPTIONS = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'LIGHT_MEDIUM', label: 'Light Medium' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'MEDIUM_DARK', label: 'Medium Dark' },
  { value: 'DARK', label: 'Dark' },
] as const;

export const ROAST_LABEL_MAP: Record<string, string> = {
  LIGHT: 'Light',
  LIGHT_MEDIUM: 'Light Medium',
  MEDIUM: 'Medium',
  MEDIUM_DARK: 'Medium Dark',
  DARK: 'Dark',
};
