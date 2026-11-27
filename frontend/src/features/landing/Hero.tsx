import { buttonStyles } from '@/components/buttonStyles';
import { siteConfig } from '@/config/site';
import { EditorDemo } from './EditorDemo';

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:pt-14">
      <h1 className="text-[clamp(2.4rem,6.2vw,4.75rem)] font-semibold leading-[1] tracking-tight">
        <span className="block text-balance">Write the first half.</span>
        <span className="block text-balance">SynthCode writes the rest.</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
        An AI-native code editor that completes, explains and refactors code using the context of
        your whole project.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href={siteConfig.repoUrl} className={buttonStyles.primary}>
          View on GitHub
        </a>
        <a href="#how-it-works" className={buttonStyles.secondary}>
          See how it works
        </a>
      </div>

      <div className="mt-12">
        <EditorDemo />
        <p className="mt-3 text-sm text-ink-soft">
          This is a scripted demo with canned suggestions. The model-backed editor is still being
          built.
        </p>
      </div>
    </section>
  );
}
