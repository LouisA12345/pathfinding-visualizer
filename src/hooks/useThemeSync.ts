import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';

export function useThemeSync(): void {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
