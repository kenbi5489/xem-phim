import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  
  const saved = localStorage.getItem('cinevina_theme') as ThemeMode;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  
  // Default to light mode for a fresh, bright modern UI as requested by user
  return 'light';
};

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }

  // Update mobile browser status bar / theme-color for iPhone and Android
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0B0F19' : '#F8FAFC');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  applyThemeToDOM(initialTheme);

  return {
    theme: initialTheme,
    setTheme: (theme: ThemeMode) => {
      localStorage.setItem('cinevina_theme', theme);
      applyThemeToDOM(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const current = get().theme;
      const next: ThemeMode = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('cinevina_theme', next);
      applyThemeToDOM(next);
      set({ theme: next });
    },
  };
});
