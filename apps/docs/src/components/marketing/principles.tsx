/**
 * The bracketed strip. A marketing page would normally put growth metrics
 * here; Tablekeep has none yet, so it carries the three product principles
 * instead — true statements that survive the closed beta.
 */
const PRINCIPLES = [
  { label: "Built for", value: "In-person play" },
  { label: "Campaign data", value: "Private by default" },
  { label: "Rules and books", value: "Stay yours" },
] as const;

export function Principles() {
  return (
    <section className="px-6 pb-20 sm:pb-24">
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Bracket ornaments, drawn rather than imported as icons. */}
        <span
          aria-hidden
          className="absolute top-0 bottom-0 left-0 w-4 rounded-l-lg border-border border-y border-l"
        />
        <span
          aria-hidden
          className="absolute top-0 right-0 bottom-0 w-4 rounded-r-lg border-border border-y border-r"
        />
        <dl className="grid gap-8 px-10 py-8 text-center sm:grid-cols-3 sm:gap-4">
          {PRINCIPLES.map((item) => (
            <div key={item.label}>
              <dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                {item.label}
              </dt>
              <dd className="mt-2 font-semibold text-2xl tracking-tight sm:text-[1.75rem]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
