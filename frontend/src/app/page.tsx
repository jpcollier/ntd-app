"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { TrendingUp, Code2, BookOpen, BookMarked, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgencySearch } from "@/components/AgencySearch"
import { useSummary } from "@/hooks/useApi"

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const TOOLS = [
  {
    href: "/explore",
    icon: TrendingUp,
    title: "Explore Data",
    description: "Browse ridership trends as charts or a filterable table. Filter by agency, mode, and date range.",
  },
  {
    href: "/api-builder",
    icon: Code2,
    title: "API Builder",
    description: "Build API queries interactively and get code snippets in curl, Python, or JavaScript.",
  },
  {
    href: "/api-docs",
    icon: BookOpen,
    title: "API Docs",
    description: "REST API reference. No authentication required.",
  },
  {
    href: "/glossary",
    icon: BookMarked,
    title: "Glossary",
    description: "Definitions for UPT, VRM, VRH, VOMS, transit modes, and other NTD terminology.",
  },
]

export default function HomePage() {
  const router = useRouter()
  const { data: summary, isLoading: summaryLoading } = useSummary()

  return (
    <div>
      {/* Hero — full-bleed dark section */}
      <section
        className="text-white"
        style={{
          background:
            "radial-gradient(ellipse at 50% -20%, hsl(221 60% 22%) 0%, hsl(222 47% 9%) 60%)",
        }}
      >
        <div className="container max-w-4xl mx-auto px-4 py-24 text-center space-y-10">
          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">NTD Ridership Data</h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
              A queryable interface to the FTA&apos;s monthly ridership releases.
            </p>
          </div>

          {/* Search — floats on a white card against the dark bg */}
          <div className="max-w-xl mx-auto space-y-2">
            <div className="bg-white rounded-xl p-1.5 shadow-2xl">
              <AgencySearch
                onSelect={(ntdId) => router.push(`/explore?ntd_id=${ntdId}`)}
                placeholder="Search for a transit agency..."
              />
            </div>
            <p className="text-xs text-white/40">
              Select an agency to jump straight to its ridership charts
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {summaryLoading ? (
              <>
                <div className="h-10 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-28 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-28 bg-white/10 rounded animate-pulse" />
              </>
            ) : summary ? (
              <>
                <div className="text-center">
                  <p className="text-4xl font-bold tabular-nums">
                    {summary.total_agencies.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-widest mt-1.5">Agencies</p>
                </div>
                <div className="w-px h-10 bg-white/15 hidden sm:block" />
                <div className="text-center">
                  <p className="text-4xl font-bold tabular-nums">
                    {formatNumber(summary.total_records)}
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-widest mt-1.5">Records</p>
                </div>
                <div className="w-px h-10 bg-white/15 hidden sm:block" />
                <div className="text-center">
                  <p className="text-4xl font-bold tabular-nums">
                    {summary.date_range.min_year}–{summary.date_range.max_year}
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-widest mt-1.5">Coverage</p>
                </div>
                {summary.date_range.max_month && summary.date_range.max_year && (
                  <>
                    <div className="w-px h-10 bg-white/15 hidden sm:block" />
                    <div className="text-center">
                      <p className="text-4xl font-bold tabular-nums">
                        {MONTH_NAMES[summary.date_range.max_month - 1]} {summary.date_range.max_year}
                      </p>
                      <p className="text-xs text-white/40 uppercase tracking-widest mt-1.5">Latest Data</p>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Rest of page */}
      <div className="container max-w-4xl mx-auto py-16 space-y-16">
      {/* Tools */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20 cursor-pointer">
                  <CardContent className="pt-5 pb-4 px-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold text-sm">{tool.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                    <p className="text-xs text-primary font-medium">Open →</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* About the Data */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">About</h2>
        <Card>
          <CardContent className="pt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The{" "}
              <span className="font-medium text-foreground">Federal Transit Administration (FTA)</span>{" "}
              publishes monthly ridership data as Excel files through the{" "}
              <span className="font-medium text-foreground">National Transit Database (NTD)</span>.
              This site loads those releases into a database and exposes them through a browsable
              interface and a REST API. Source data is available directly from the{" "}
              <a
                href="https://www.transit.dot.gov/ntd/data-product/monthly-module-adjusted-data-release"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                FTA Monthly Module Adjusted Data Release
              </a>.
            </p>
            <p>
              The data covers monthly ridership for hundreds of agencies across all 50 states going
              back to 2002. Each record includes four metrics —{" "}
              <span className="font-medium text-foreground">UPT</span>,{" "}
              <span className="font-medium text-foreground">VRM</span>,{" "}
              <span className="font-medium text-foreground">VRH</span>, and{" "}
              <span className="font-medium text-foreground">VOMS</span> — broken down by transit
              mode and type of service. See the{" "}
              <Link href="/glossary" className="text-primary underline underline-offset-2">
                Glossary
              </Link>{" "}
              for definitions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Caveats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Data Caveats</h2>
        <div className="border-l-4 border-amber-400 bg-amber-50/60 dark:bg-amber-950/20 pl-5 pr-4 py-4 rounded-r-md space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Keep these in mind when working with this data
          </div>
          <p className="text-sm text-muted-foreground">
            This site is not affiliated with the Federal Transit Administration. For official figures, always refer to the{" "}
            <a
              href="https://www.transit.dot.gov/ntd/data-product/monthly-module-adjusted-data-release"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-amber-700 dark:text-amber-400"
            >
              source data
            </a>{" "}
            published by the FTA directly.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Estimated data</span>
              {" — "}The most recent months are provisional estimates submitted by agencies before
              the FTA has completed final validation. Estimated records are flagged
              {" ("}
              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">is_estimated = true</code>
              {") "}
              and may differ from final reported values.
            </li>
            <li>
              <span className="font-medium text-foreground">Reporting lag</span>
              {" — "}Final validated data typically lags several months behind the current date.
              The most recent records reflect the latest available NTD release, which may not
              include the past 2–4 months.
            </li>
          </ul>
        </div>
      </div>
    </div>
    </div>
  )
}
