import { Link } from '@tanstack/react-router';
import { Logo } from '@/components/Logo';
import { StatusPill } from '@/components/StatusPill';

export function Navbar() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link to="/" aria-label="SynthCode home">
        <Logo />
      </Link>
      <nav aria-label="Primary" className="flex items-center gap-7 text-sm">
        <a href="#features" className="hidden hover:underline underline-offset-4 sm:inline">
          Features
        </a>
        <a href="#how-it-works" className="hidden hover:underline underline-offset-4 sm:inline">
          How it works
        </a>
        <StatusPill />
      </nav>
    </header>
  );
}
