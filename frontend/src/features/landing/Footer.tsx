import { Logo } from '@/components/Logo';
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink-soft">
      <div className="flex items-center gap-4">
        <Logo className="text-ink" />
        <span>An in-progress project.</span>
      </div>
      <a href={siteConfig.repoUrl} className="underline underline-offset-4 hover:text-ink">
        GitHub
      </a>
    </footer>
  );
}
