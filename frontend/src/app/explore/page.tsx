"use client"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BarChart2, Table2, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart"
import { RidershipTable } from "@/components/tables/RidershipTable"
import { AgencySearch } from "@/components/AgencySearch"
import {
  useAgency,
  useModes,
  useTimeseries,
  useRidership,
  useTopAgencies,
  useSummary,
} from "@/hooks/useApi"
import { getExportCsvUrl, getExportExcelUrl } from "@/lib/api"

const METRICS = [
  { value: "upt", label: "Unlinked Passenger Trips (UPT)" },
  { value: "vrm", label: "Vehicle Revenue Miles (VRM)" },
  { value: "vrh", label: "Vehicle Revenue Hours (VRH)" },
  { value: "voms", label: "Vehicles Operated Max Service (VOMS)" },
]

const YEAR_PRESETS = [
  { label: "5Y", years: 5 },
  { label: "10Y", years: 10 },
  { label: "20Y", years: 20 },
  { label: "All", years: null },
]

function ExplorePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialNtdId = searchParams.get("ntd_id") || ""
  const hasDefaulted = useRef(false)

  const [selectedNtdId, setSelectedNtdId] = useState(initialNtdId)
  const [selectedMode, setSelectedMode] = useState(searchParams.get("mode") || "")
  const [selectedMetric, setSelectedMetric] = useState(searchParams.get("metric") || "upt")
  const [selectedTos, setSelectedTos] = useState(searchParams.get("tos") || "")
  const [startYear, setStartYear] = useState<number | undefined>(
    searchParams.get("start_year") ? parseInt(searchParams.get("start_year")!) : undefined
  )
  const [endYear, setEndYear] = useState<number | undefined>(
    searchParams.get("end_year") ? parseInt(searchParams.get("end_year")!) : undefined
  )
  const [view, setView] = useState<"chart" | "table">(
    searchParams.get("view") === "table" ? "table" : "chart"
  )

  const { data: topAgencies } = useTopAgencies({ limit: 1 })
  const { data: summary } = useSummary()
  const { data: modes } = useModes({ ntd_id: selectedNtdId || undefined })
  const { data: selectedAgency } = useAgency(selectedNtdId)

  const { data: timeseriesData, isLoading: chartLoading } = useTimeseries({
    ntd_id: selectedNtdId,
    mode_codes: selectedMode || undefined,
    type_of_service: selectedTos || undefined,
    metric: selectedMetric,
    start_year: startYear,
    end_year: endYear,
  })

  const { data: ridershipData, isLoading: tableLoading } = useRidership({
    ntd_ids: selectedNtdId || undefined,
    mode_codes: selectedMode || undefined,
    type_of_service: selectedTos || undefined,
    start_year: startYear,
    end_year: endYear,
    per_page: 500,
  })

  const maxYear = summary?.date_range.max_year ?? undefined

  const agencyMap = useMemo(() => {
    const map = new Map<number, string>()
    if (selectedAgency) map.set(selectedAgency.id, selectedAgency.name)
    return map
  }, [selectedAgency])

  const exportParams = {
    ntd_ids: selectedNtdId || undefined,
    mode_codes: selectedMode || undefined,
    start_year: startYear,
    end_year: endYear,
  }

  // Reset mode if it's no longer available for the selected agency
  useEffect(() => {
    if (!selectedMode || !modes) return
    if (!modes.some((m) => m.code === selectedMode)) {
      setSelectedMode("")
      updateFilter("mode", undefined)
    }
  }, [modes]) // eslint-disable-line react-hooks/exhaustive-deps

  // Default to top agency when no URL param is present
  useEffect(() => {
    if (hasDefaulted.current || initialNtdId) return
    if (topAgencies?.[0]) {
      hasDefaulted.current = true
      const ntdId = topAgencies[0].ntd_id
      setSelectedNtdId(ntdId)
      router.replace(`?ntd_id=${ntdId}`, { scroll: false })
    }
  }, [topAgencies]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function handleNtdId(ntdId: string) {
    setSelectedNtdId(ntdId)
    updateFilter("ntd_id", ntdId)
  }

  function handleMode(v: string) {
    const val = v === "__all__" ? "" : v
    setSelectedMode(val)
    updateFilter("mode", val || undefined)
  }

  function handleMetric(v: string) {
    setSelectedMetric(v)
    updateFilter("metric", v !== "upt" ? v : undefined)
  }

  function handleTos(v: string) {
    const val = v === "__all__" ? "" : v
    setSelectedTos(val)
    updateFilter("tos", val || undefined)
  }

  function handleView(v: string) {
    const next = v as "chart" | "table"
    setView(next)
    updateFilter("view", next !== "chart" ? next : undefined)
  }

  function applyPreset(years: number | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (years === null || !maxYear) {
      setStartYear(undefined)
      setEndYear(undefined)
      params.delete("start_year")
      params.delete("end_year")
    } else {
      const start = maxYear - years + 1
      setStartYear(start)
      setEndYear(undefined)
      params.set("start_year", start.toString())
      params.delete("end_year")
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function isActivePreset(years: number | null) {
    if (years === null) return !startYear && !endYear
    if (!maxYear || endYear) return false
    return startYear === maxYear - years + 1
  }

  function handleReset() {
    setSelectedNtdId("")
    setSelectedMode("")
    setSelectedMetric("upt")
    setSelectedTos("")
    setStartYear(undefined)
    setEndYear(undefined)
    router.replace("?", { scroll: false })
  }

  const contentTitle = selectedAgency
    ? view === "chart"
      ? `${selectedAgency.name} — ${METRICS.find((m) => m.value === selectedMetric)?.label}`
      : selectedAgency.name
    : "Select an agency to view data"

  return (
    <div className="container py-8">
      <div className="mb-8 pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">Explore Data</h1>
        <p className="text-muted-foreground mt-2">
          Visualize and browse ridership data for any agency, mode, and time period
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1 h-fit shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Agency</Label>
              <AgencySearch onSelect={handleNtdId} placeholder="Search agencies..." />
              {selectedAgency && (
                <p className="text-xs text-muted-foreground truncate">
                  Selected:{" "}
                  <span className="font-medium text-foreground">{selectedAgency.name}</span>
                </p>
              )}
            </div>

            <hr className="border-border" />

            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={selectedMode || "__all__"} onValueChange={handleMode}>
                <SelectTrigger>
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All modes</SelectItem>
                  {modes?.map((mode) => (
                    <SelectItem key={mode.code} value={mode.code}>
                      {mode.name} ({mode.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <hr className="border-border" />

            <div className="space-y-2">
              <Label>Type of Service</Label>
              <Select value={selectedTos || "__all__"} onValueChange={handleTos}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="DO">Directly Operated</SelectItem>
                  <SelectItem value="PT">Purchased Transportation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <hr className="border-border" />

            <div className="space-y-2">
              <Label>Year Range</Label>
              <div className="flex gap-1">
                {YEAR_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant={isActivePreset(p.years) ? "default" : "outline"}
                    size="sm"
                    className="flex-1 px-0"
                    onClick={() => applyPreset(p.years)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="number"
                    placeholder="2002"
                    min={2002}
                    value={startYear || ""}
                    onChange={(e) => {
                      const v = e.target.value ? parseInt(e.target.value) : undefined
                      setStartYear(v)
                      updateFilter("start_year", v?.toString())
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="number"
                    placeholder={maxYear?.toString() || "now"}
                    value={endYear || ""}
                    onChange={(e) => {
                      const v = e.target.value ? parseInt(e.target.value) : undefined
                      setEndYear(v)
                      updateFilter("end_year", v?.toString())
                    }}
                  />
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleReset}>
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Tabs
          value={view}
          onValueChange={handleView}
          className="lg:col-span-3"
        >
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <CardTitle className="text-base leading-snug min-w-0 pt-1">
                {contentTitle}
              </CardTitle>
              <TabsList className="shrink-0">
                <TabsTrigger value="chart" className="flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" />
                  Chart
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1.5">
                  <Table2 className="h-3.5 w-3.5" />
                  Table
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Chart Tab */}
              <TabsContent value="chart" className="mt-0">
                {/* Metric selector */}
                <div className="flex gap-1.5 mb-5 flex-wrap">
                  {METRICS.map((m) => (
                    <Button
                      key={m.value}
                      variant={selectedMetric === m.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMetric(m.value)}
                    >
                      {m.value.toUpperCase()}
                    </Button>
                  ))}
                </div>
                {chartLoading ? (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    Loading chart data...
                  </div>
                ) : (
                  <TimeSeriesChart data={timeseriesData || []} height={420} />
                )}
              </TabsContent>

              {/* Table Tab */}
              <TabsContent value="table" className="mt-0">
                {/* Export + record count row */}
                <div className="flex items-center justify-between mb-4">
                  {ridershipData ? (
                    <p className="text-sm text-muted-foreground">
                      {ridershipData.total.toLocaleString()} records
                    </p>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2">
                    <a href={getExportCsvUrl(exportParams)} download>
                      <Button variant="outline" size="sm">
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        CSV
                      </Button>
                    </a>
                    <a href={getExportExcelUrl(exportParams)} download>
                      <Button variant="outline" size="sm">
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Excel
                      </Button>
                    </a>
                  </div>
                </div>
                {tableLoading ? (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    Loading data...
                  </div>
                ) : !selectedNtdId && !selectedMode ? (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    Select an agency or mode to view data
                  </div>
                ) : (
                  <RidershipTable data={ridershipData?.items || []} agencyMap={agencyMap} />
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorePageInner />
    </Suspense>
  )
}
