"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const METRICS = [
  {
    abbr: "UPT",
    name: "Unlinked Passenger Trips",
    description:
      "The number of passengers who board public transportation vehicles. Each boarding is counted as one trip — a passenger transferring between routes counts as two unlinked trips. UPT is the primary measure of ridership volume.",
  },
  {
    abbr: "VRM",
    name: "Vehicle Revenue Miles",
    description:
      "The miles traveled by vehicles while in revenue service — meaning the vehicle is available to carry fare-paying passengers. Deadhead miles (traveling to/from a garage or between routes without passengers) are excluded.",
  },
  {
    abbr: "VRH",
    name: "Vehicle Revenue Hours",
    description:
      "The hours that vehicles operate while in revenue service. Like VRM, this excludes time spent on non-revenue activities such as deadheading or layovers. VRH is used to measure service supply.",
  },
  {
    abbr: "VOMS",
    name: "Vehicles Operated in Maximum Service",
    description:
      "The number of vehicles deployed during the peak service period — the maximum number of vehicles in simultaneous revenue operation across the schedule. VOMS reflects the capacity of a transit fleet during its busiest time.",
  },
]

const MODES_NON_RAIL = [
  { code: "MB", name: "Bus", description: "Fixed-route bus service operating on streets and highways." },
  { code: "RB", name: "Bus Rapid Transit", description: "High-frequency bus service with dedicated lanes, off-board fare payment, and level boarding." },
  { code: "CB", name: "Commuter Bus", description: "Fixed-route bus service primarily connecting suburbs to a central city, often with limited stops and higher fares." },
  { code: "DR", name: "Demand Response", description: "Flexible, non-fixed-route service where vehicles are dispatched to pick up passengers based on requests (e.g. paratransit)." },
  { code: "DT", name: "Demand Response Taxi", description: "Demand response service provided using taxicabs or similar vehicles under contract to a transit agency." },
  { code: "FB", name: "Ferryboat", description: "Passenger ferry service operating on water routes." },
  { code: "PB", name: "Publico", description: "Shared-ride van or taxi service common in Puerto Rico, operating on semi-fixed routes." },
  { code: "TB", name: "Trolleybus", description: "Electric buses drawing power from overhead wires, operating on flexible routes." },
  { code: "VP", name: "Vanpool", description: "Commuter service using vans carrying groups of passengers traveling regular routes to a common destination." },
]

const MODES_RAIL = [
  { code: "AR", name: "Alaska Railroad", description: "Passenger rail service operated by the Alaska Railroad Corporation." },
  { code: "CC", name: "Cable Car", description: "Rail vehicles pulled by a continuously moving underground cable, as in San Francisco." },
  { code: "CR", name: "Commuter Rail", description: "Heavy rail service connecting suburbs to a central city, typically using shared freight corridors." },
  { code: "HR", name: "Heavy Rail", description: "High-capacity urban rail (subway/metro) operating on exclusive rights-of-way with high-platform boarding." },
  { code: "YR", name: "Hybrid Rail", description: "Rail service using vehicles that can operate both on electrified rail and on diesel under their own power." },
  { code: "IP", name: "Inclined Plane", description: "Rail vehicles that travel up and down steep grades on a cable-driven incline (e.g. Pittsburgh funiculars)." },
  { code: "LR", name: "Light Rail", description: "Electric rail service operating on dedicated tracks, often at street level, with lower capacity than heavy rail." },
  { code: "MG", name: "Monorail / Automated Guideway", description: "Driverless or manually operated vehicles on a fixed elevated guideway (e.g. airport people movers, monorails)." },
  { code: "OR", name: "Other Rail", description: "Rail modes not otherwise classified in the NTD." },
  { code: "SR", name: "Streetcar Rail", description: "Electric rail vehicles operating in mixed traffic on city streets, typically with shorter routes than light rail." },
]

const MODES_OTHER = [
  { code: "TR", name: "Aerial Tramway", description: "Suspended cable cars traveling between two fixed terminals, used in mountainous or elevated terrain." },
]

const AGENCY_TERMS = [
  {
    abbr: "NTD",
    name: "National Transit Database",
    description:
      "The Federal Transit Administration's primary data collection system for US public transportation. Transit agencies receiving FTA funding are required to report ridership, financial, and operational data to the NTD annually.",
  },
  {
    abbr: "FTA",
    name: "Federal Transit Administration",
    description:
      "The US Department of Transportation agency responsible for administering federal transit funding and overseeing the NTD. The FTA publishes monthly ridership data used in this application.",
  },
  {
    abbr: "NTD ID",
    name: "NTD Identifier",
    description:
      "A unique numeric code assigned by the FTA to each transit agency in the National Transit Database. NTD IDs are used throughout this application to identify agencies.",
  },
  {
    abbr: "UZA",
    name: "Urbanized Area",
    description:
      "A Census Bureau-defined geographic area with a population of 50,000 or more. Transit agencies report data at the UZA level. Large metro areas may have multiple agencies serving the same UZA.",
  },
  {
    abbr: "DO",
    name: "Directly Operated",
    description:
      "Service operated directly by the transit agency using its own employees and vehicles. Contrasted with purchased transportation.",
  },
  {
    abbr: "PT",
    name: "Purchased Transportation",
    description:
      "Service contracted by a transit agency to a third-party operator. The agency pays a contractor to provide service on its behalf. Ridership still counts toward the agency's NTD totals.",
  },
  {
    abbr: "Reporter Type",
    name: "Reporter Type",
    description:
      "The category under which an agency reports to the NTD. Common types include Full Reporter (large urban agencies with detailed reporting requirements) and Small Systems (agencies in smaller urbanized areas with simplified reporting).",
  },
  {
    abbr: "UPT Estimates",
    name: "Unlinked Passenger Trip Estimates",
    description:
      "Provisional ridership figures for the most recent months, before agencies have submitted and the FTA has validated final NTD data. Estimates are flagged separately in this dataset and may differ from final reported values.",
  },
]

function TermRow({ abbr, name, description }: { abbr: string; name: string; description: string }) {
  return (
    <div className="border-b last:border-0 py-4">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-mono font-semibold text-sm bg-muted px-2 py-0.5 rounded shrink-0">
          {abbr}
        </span>
        <span className="font-medium">{name}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function ModeCard({ code, name, description }: { code: string; name: string; description: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono font-semibold text-sm bg-muted px-2 py-0.5 rounded shrink-0">
          {code}
        </span>
        <span className="font-medium text-sm">{name}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function ModeGroup({ title, modes }: { title: string; modes: typeof MODES_RAIL }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modes.map((m) => (
          <ModeCard key={m.code} {...m} />
        ))}
      </div>
    </div>
  )
}

export default function GlossaryPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8 pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">Glossary</h1>
        <p className="text-muted-foreground mt-2">
          Definitions for terms and abbreviations used in the FTA National Transit Database dataset
        </p>
      </div>

      <Tabs defaultValue="metrics">
        <TabsList className="mb-6">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="modes">Transit Modes</TabsTrigger>
          <TabsTrigger value="agency">Service &amp; Agency Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                The four core measures reported by transit agencies in the NTD each month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {METRICS.map((m) => (
                <TermRow key={m.abbr} {...m} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modes">
          <Card>
            <CardHeader>
              <CardTitle>Transit Modes</CardTitle>
              <CardDescription>
                The NTD classifies transit service into 20 mode codes. Each agency-mode combination is reported separately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModeGroup title="Non-Rail Modes" modes={MODES_NON_RAIL} />
              <ModeGroup title="Rail Modes" modes={MODES_RAIL} />
              <ModeGroup title="Other Modes" modes={MODES_OTHER} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agency">
          <Card>
            <CardHeader>
              <CardTitle>Service &amp; Agency Terms</CardTitle>
              <CardDescription>
                Terms related to how agencies are classified and how service is organised in the NTD
              </CardDescription>
            </CardHeader>
            <CardContent>
              {AGENCY_TERMS.map((t) => (
                <TermRow key={t.abbr} {...t} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
