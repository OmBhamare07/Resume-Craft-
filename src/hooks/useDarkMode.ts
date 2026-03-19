import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('rc_theme') === 'dark' ||
      (!localStorage.getItem('rc_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('rc_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('rc_theme', 'light');
    }
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}
