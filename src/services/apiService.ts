import { ThemeConfiguration } from "../types";

// Load themes from /themes.json (public folder)
export const apiService = {
  fetchPlatformThemes: async (): Promise<ThemeConfiguration[]> => {
    const res = await fetch("/themes.json");
    return await res.json();
  },
};
