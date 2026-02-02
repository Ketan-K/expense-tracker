/**
 * Theme Configuration Loader
 * Automatically loads the correct theme based on NEXT_PUBLIC_THEME environment variable
 */

const themeName = process.env.NEXT_PUBLIC_THEME || "default";

/**
 * Active theme configuration
 * This is imported at build time based on the NEXT_PUBLIC_THEME environment variable
 */
let themeConfig;

// Import theme config dynamically at build time
if (themeName === "acme") {
  themeConfig = (await import("@/themes/acme/config")).themeConfig;
} else if (themeName === "vibe") {
  themeConfig = (await import("@/themes/vibe/config")).themeConfig;
} else {
  // Default theme
  themeConfig = (await import("@/themes/default/config")).themeConfig;
}

export const theme = themeConfig;
export default theme;

/**
 * Helper to get theme color for programmatic use
 */
export function getThemeColor(colorKey: keyof typeof theme.colors): string {
  return theme.colors[colorKey];
}

/**
 * Current theme name
 */
export const currentTheme = themeName;
