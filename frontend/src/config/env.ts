export const env = {
  /** Empty string means "same origin": Vite proxies /api in dev and nginx does in Docker. */
  apiBaseUrl: (): string => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
};
