/**
 * Theme Styles Loader
 * Loads the correct theme CSS based on NEXT_PUBLIC_THEME environment variable
 */

const themeName = process.env.NEXT_PUBLIC_THEME || "default";

// Dynamically import theme CSS using themeName
// eslint-disable-next-line @typescript-eslint/no-require-imports
require(`@/themes/${themeName}/theme.css`);

// Re-export theme name for reference
export const activeTheme = themeName;
