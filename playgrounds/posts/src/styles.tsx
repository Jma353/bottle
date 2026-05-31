import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    /* Colors */
    --color-white: #ffffff;
    --color-gray-50: #f9fafb;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-900: #111827;

    --color-amber-100: #fef3c7;
    --color-amber-800: #92400e;

    /* Spacing */
    --space-1: 4px;
    --space-2: 6px;
    --space-3: 8px;
    --space-4: 10px;
    --space-5: 12px;
    --space-6: 16px;
    --space-7: 24px;

    /* Border radius */
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;

    /* Font sizes */
    --font-size-xs: 12px;
    --font-size-sm: 13px;
    --font-size-base: 14px;
    --font-size-md: 15px;
    --font-size-lg: 16px;
    --font-size-xl: 18px;

    /* Font families */
    --font-sans: system-ui, -apple-system, sans-serif;
    --font-mono: ui-monospace, monospace;
  }
`;
