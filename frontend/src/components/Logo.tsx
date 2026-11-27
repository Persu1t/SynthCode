/** A square wave inside a rounded square: the "synth" in SynthCode. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#16222D" />
        <path
          d="M6 20V12h5v8h5v-8h5v8h5"
          fill="none"
          stroke="#8FA2FF"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">SynthCode</span>
    </span>
  );
}
