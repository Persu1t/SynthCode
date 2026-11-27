const features = [
  {
    title: 'Completes as you type',
    body: "Suggestions appear inline and match the style of the file you're in. Accept one, or keep typing to ignore it.",
  },
  {
    title: 'Answers questions about your code',
    body: 'Ask where something is defined or why a test fails. Answers point to the files they came from.',
  },
  {
    title: 'Edits from a plain-English prompt',
    body: 'Select code and say what should change: rename across files, add tests, explain a block or tidy a function.',
  },
  {
    title: 'Works with the model you choose',
    body: 'Bring your own API key or run a model locally. Your code only goes where you send it.',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[5fr_7fr]">
        <div>
          <h2 className="max-w-md text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            An editor that already knows your project
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
            SynthCode keeps track of the surrounding code, so you don't have to paste it into a chat
            window to get a useful answer.
          </p>
        </div>

        <dl>
          {features.map(feature => (
            <div
              key={feature.title}
              className="grid gap-2 border-t border-line py-7 first:border-t-0 first:pt-0 sm:grid-cols-[13rem_1fr] sm:gap-8"
            >
              <dt className="text-xl font-semibold leading-snug">{feature.title}</dt>
              <dd className="leading-relaxed text-ink-soft">{feature.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
