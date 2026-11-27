const base =
  'inline-flex items-center justify-center rounded-lg px-5 py-3 text-base font-medium transition-colors';

export const buttonStyles = {
  primary: `${base} bg-ai text-white hover:bg-ink`,
  secondary: `${base} border border-ink/30 text-ink hover:bg-ink hover:text-panel`,
  onDark: `${base} bg-panel text-ink hover:bg-white`,
};
