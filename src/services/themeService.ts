import { injectThemeStyles } from "../services/themeStyleService";
import { ThemeConfiguration, Theme } from '../types';

/**
 * Retrieves the full configuration for a given theme ID from a dynamic list.
 * @param themeId The ID of the theme.
 * @param allThemes The complete list of available themes.
 * @returns The ThemeConfiguration object.
 */
export const getThemeConfig = (themeId: Theme, allThemes: ThemeConfiguration[]): ThemeConfiguration | undefined => {
    return allThemes.find(t => t.id === themeId);
};

/**
 * A simple key-value map of available theme IDs to their display names.
 */
export const getAvailableThemesMap = (allThemes: ThemeConfiguration[]): Record<Theme, string> => {
    // FIX: A type assertion is necessary here. The `Object.fromEntries` method returns a
    // generic string-keyed object (`{ [k: string]: string }`), but the function signature
    // requires a more specific `Record<Theme, string>` which includes all known theme
    // names as properties. This cast is safe because `allThemes` will create a complete map.
    return Object.fromEntries(
        allThemes.map(t => [t.id, t.name])
    ) as any;
};