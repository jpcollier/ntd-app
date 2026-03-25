"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TimeSeriesData } from "@/lib/api"

const COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#ca8a04", // yellow
  "#9333ea", // purple
  "#0891b2", // cyan
  "#ea580c", // orange
  "#84cc16", // lime
]

const MODE_NAMES: Record<string, string> = {
  MB: "Bus", RB: "Bus Rapid Transit", CB: "Commuter Bus",
  DR: "Demand Response", DT: "Demand Response Taxi", FB: "Ferryboat",
  PB: "Publico", TB: "Trolleybus", VP: "Vanpool", TR: "Aerial Tramway",
  AR: "Alaska Railroad", CC: "Cable Car", CR: "Commuter Rail",
  HR: "Heavy Rail", YR: "Hybrid Rail", IP: "Inclined Plane",
  LR: "Light Rail", MG: "Monorail/Automated Guideway", OR: "Other Rail",
  SR: "Streetcar Rail",
}

const TOS_NAMES: Record<string, string> = {
  DO: "Directly Operated",
  PT: "Purchased Transportation",
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[]
  height?: number
}

function buildLabel(series: TimeSeriesData, allSeries: TimeSeriesData[]): string {
  // mode_code may be "MB" (single series) or "MB (DO)" (TOS-split series)
  const match = series.mode_code.match(/^(\w+)(?:\s+\((\w+)\))?$/)
  const baseCode = match?.[1] ?? series.mode_code
  const tosCode = match?.[2]

  const modeName = MODE_NAMES[baseCode] ?? baseCode
  const tosSuffix = tosCode ? ` \u2014 ${TOS_NAMES[tosCode] ?? tosCode}` : ""

  const multiAgency = new Set(allSeries.map((s) => s.ntd_id)).size > 1
  const agencyPrefix = multiAgency ? `${series.agency_name} \u2014 ` : ""

  return `${agencyPrefix}${modeName}${tosSuffix}`
}

export function TimeSeriesChart({ data, height = 400 }: TimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available. Select an agency and mode to view ridership trends.
      </div>
    )
  }

  // Transform data for Recharts — unified x-axis with all dates
  const dateMap = new Map<string, Record<string, number | string | null>>()

  data.forEach((series) => {
    series.data.forEach((point) => {
      const dateKey = `${point.year}-${String(point.month).padStart(2, "0")}`
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey })
      }
      const record = dateMap.get(dateKey)!
      record[buildLabel(series, data)] = point.value
    })
  })

  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  )

  const seriesKeys = data.map((series) => buildLabel(series, data))

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split("-")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip
          labelFormatter={formatDate}
          formatter={(value: number, name: string) => [formatValue(value), name]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        {seriesKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
