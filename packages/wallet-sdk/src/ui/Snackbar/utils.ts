export function isDarkMode(): boolean {
  return window?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}
