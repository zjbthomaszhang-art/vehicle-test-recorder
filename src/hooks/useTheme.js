import { useState, useEffect } from 'react';

// Singleton: apply theme to DOM synchronously
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}

function getInitialTheme() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return 'dark';
}

// Apply initial theme immediately (before React renders) to avoid flash
const _initial = getInitialTheme();
if (typeof document !== 'undefined') {
  applyTheme(_initial);
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Listen for theme changes from other component instances
    const handleThemeChange = (e) => {
      setTheme(e.detail);
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    // 1. Apply to DOM synchronously — no async useEffect delay
    applyTheme(newTheme);
    // 2. Update local state
    setTheme(newTheme);
    // 3. Broadcast to all other useTheme instances
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  return { theme, toggleTheme };
}
