import { useHealth } from '@/hooks/api/useHealth';

/** Shows whether the backend health endpoint is reachable. */
export function StatusPill() {
  const { data, isPending, isError } = useHealth();

  const state = isPending ? 'checking' : isError ? 'offline' : 'online';
  const label = { checking: 'Checking API', offline: 'API offline', online: 'API online' }[state];
  const dot = { checking: 'bg-ink-soft/50', offline: 'bg-orange-600', online: 'bg-emerald-600' }[state];
  const detail = data ? `${data.service} v${data.version}, up ${data.uptimeSeconds}s` : undefined;

  return (
    <span
      role="status"
      title={detail}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-sm"
    >
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
