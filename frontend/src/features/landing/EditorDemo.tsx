import { useState } from 'react';
import { highlight, type TokenType } from './highlight';
import { scenarios } from './scenarios';
import { useDemoCycle, usePrefersReducedMotion, type Phase } from './useDemoCycle';

const LINE_HEIGHT = 22;

const TOKEN_CLASS: Record<TokenType, string> = {
  comment: 'text-code-comment',
  string: 'text-code-string',
  number: 'text-code-number',
  keyword: 'text-code-keyword',
  type: 'text-code-type',
  fn: 'text-code-fn',
  plain: '',
};

const STATUS: Record<Phase, { label: string; dot: string }> = {
  idle: { label: 'Waiting for you to type', dot: 'bg-gutter' },
  suggesting: { label: 'SynthCode is writing', dot: 'bg-ai-ghost' },
  ready: { label: 'Suggestion ready', dot: 'bg-code-string' },
  accepted: { label: 'Suggestion accepted', dot: 'bg-code-string' },
};

// Reserve room for the longest scenario so the page doesn't jump while code types in.
const MAX_LINES = Math.max(
  ...scenarios.map(s => s.prefix.split('\n').length + s.suggestion.split('\n').length),
);

export function EditorDemo() {
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const { scenario, index, phase, visibleSuggestion, select, accept } = useDemoCycle(
    scenarios,
    reducedMotion,
    paused,
  );

  const prefixLines = scenario.prefix.split('\n');
  const suggestionLines = visibleSuggestion ? visibleSuggestion.split('\n') : [];
  const accepted = phase === 'accepted';

  const lines = [
    ...prefixLines.map(text => ({ text, ghost: false })),
    ...suggestionLines.map(text => ({ text, ghost: !accepted })),
  ];
  const caretLine = accepted ? lines.length - 1 : prefixLines.length - 1;

  return (
    <section
      aria-label="Interactive editor demo"
      className="dark-surface overflow-hidden rounded-xl border border-ink/25 bg-editor shadow-[0_30px_60px_-30px_rgba(22,34,45,0.55)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        role="group"
        aria-label="Demo files"
        className="flex gap-1 overflow-x-auto border-b border-white/10 bg-editor-raised px-2 pt-2"
      >
        {scenarios.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={i === index}
            onClick={() => select(i)}
            className={`whitespace-nowrap rounded-t-md border-t-2 px-4 py-2 font-mono text-xs transition-colors ${
              i === index
                ? 'border-ai-ghost bg-editor text-editor-ink'
                : 'border-transparent text-editor-ink/60 hover:text-editor-ink'
            }`}
          >
            {item.file}
          </button>
        ))}
      </div>

      {/* The animated code is decorative; the caption below carries the meaning. */}
      <p className="sr-only">
        Demo: the developer writes the start of a file and SynthCode suggests the rest. {scenario.caption}
      </p>
      <div
        aria-hidden="true"
        className="overflow-x-auto py-5 font-mono text-[13px] text-editor-ink"
        style={{ minHeight: MAX_LINES * LINE_HEIGHT + 40, lineHeight: `${LINE_HEIGHT}px` }}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-12 shrink-0 select-none pr-4 text-right text-gutter">{i + 1}</span>
            <span className="whitespace-pre pr-6">
              {line.ghost ? (
                <span className="bg-ai-ghost/10 text-ai-ghost">{line.text}</span>
              ) : (
                highlight(line.text).map((token, t) => (
                  <span key={t} className={TOKEN_CLASS[token.type]}>
                    {token.text}
                  </span>
                ))
              )}
              {i === caretLine && <span className="caret" />}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-editor-raised px-4 py-2.5 text-xs text-editor-ink/80">
        <span role="status" className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${STATUS[phase].dot}`} aria-hidden="true" />
          {STATUS[phase].label}
        </span>
        <button
          type="button"
          onClick={accept}
          disabled={phase !== 'ready'}
          className="rounded-md bg-ai-ghost px-3 py-1.5 font-medium text-editor transition-colors enabled:hover:bg-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-editor-ink/40"
        >
          Accept suggestion
        </button>
      </div>
    </section>
  );
}
