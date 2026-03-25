export function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="container py-6 text-sm text-muted-foreground">
        Built by{" "}
        <a
          href="https://johncollier.me"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline underline-offset-2"
        >
          John Collier
        </a>
        . Data sourced from the{" "}
        <a
          href="https://www.transit.dot.gov/ntd/data-product/monthly-module-adjusted-data-release"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-2"
        >
          FTA National Transit Database
        </a>
        .
      </div>
    </footer>
  )
}
