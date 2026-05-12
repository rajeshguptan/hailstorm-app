import { ref } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

const theme = ref<Theme>('dark');

export function useTheme() {
  function applyTheme() {
    localStorage.setItem('hailstorm_theme', theme.value);

    if (theme.value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme.value === 'dark');
    }
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    applyTheme();
  }

  function loadTheme() {
    const saved = localStorage.getItem('hailstorm_theme') as Theme | null;
    if (saved) {
      theme.value = saved;
    }
    applyTheme();

    // Listen for system theme changes when theme is set to 'system'
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme();
      }
    });
  }

  return {
    theme,
    setTheme,
    applyTheme,
    loadTheme
  };
}