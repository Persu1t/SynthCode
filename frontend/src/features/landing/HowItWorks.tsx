const steps = [
  {
    title: 'Open a folder',
    body: "SynthCode reads the files in your project from your own machine.",
  },
  {
    title: 'It builds an index',
    body: 'Files are split into chunks and indexed, so the editor can find the parts of your code that matter to the task.',
  },
  {
    title: 'You write or ask',
    body: 'Each suggestion or answer is built from your current file plus the most relevant chunks from the rest of the project.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>

        <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="relative border-t-2 border-ink pt-6">
              <span
                aria-hidden="true"
                className="absolute -top-[7px] left-0 size-3 rounded-full bg-ai"
              />
              <p className="font-mono text-sm text-ink-soft">Step {i + 1}</p>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 max-w-xs leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
