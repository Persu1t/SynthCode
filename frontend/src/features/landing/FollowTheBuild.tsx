import { buttonStyles } from '@/components/buttonStyles';
import { siteConfig } from '@/config/site';

export function FollowTheBuild() {
  return (
    <section className="dark-surface bg-ink text-panel">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          Follow the build
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-panel/75">
          SynthCode is in early development. The repository has the architecture notes, the roadmap
          and the API this page is already talking to.
        </p>
        <a href={siteConfig.repoUrl} className={`${buttonStyles.onDark} mt-8`}>
          View on GitHub
        </a>
      </div>
    </section>
  );
}
