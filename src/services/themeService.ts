import { ThemeConfiguration, Theme } from '../types';

export const getThemeConfig = (themeId: Theme, allThemes: ThemeConfiguration[]): ThemeConfiguration | undefined => {
  return allThemes.find(t => t.id === themeId);
};

export const getAvailableThemesMap = (allThemes: ThemeConfiguration[]): Record<Theme, string> => {
  return Object.fromEntries(
    allThemes.map(t => [t.id, t.name])
  ) as any;
};
