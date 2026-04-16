/** Apply stored or system theme before first paint (call from main.tsx). */
export function applyStoredTheme(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const stored = localStorage.getItem('aura-theme');
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
    return;
  }
  if (stored === 'light') {
    document.documentElement.classList.remove('dark');
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', prefersDark);
}
