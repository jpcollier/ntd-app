export type ParamType =
  | "text"
  | "number"
  | "select"
  | "agency-search"
  | "agency-multi"
  | "mode-multi"

export interface ParamOption {
  value: string
  label: string
}

export interface EndpointParam {
  key: string
  label: string
  type: ParamType
  required?: boolean
  placeholder?: string
  options?: ParamOption[]
  description?: string
}

export interface EndpointConfig {
  id: string
  label: string
  method: "GET"
  path: string
  pathParams: string[]
  params: EndpointParam[]
  previewable: boolean
  description: string
}

export const ENDPOINTS: EndpointConfig[] = [
  {
    id: "agencies",
    label: "GET /agencies",
    method: "GET",
    path: "/agencies",
    pathParams: [],
    previewable: true,
    description: "List all transit agencies with optional filtering by state or name search, with pagination.",
    params: [
      { key: "state", label: "State", type: "text", placeholder: "e.g. CA" },
      { key: "search", label: "Search", type: "text", placeholder: "Agency name..." },
      { key: "page", label: "Page", type: "number", placeholder: "1" },
      { key: "per_page", label: "Per Page", type: "number", placeholder: "50" },
    ],
  },
  {
    id: "agencies-states",
    label: "GET /agencies/states",
    method: "GET",
    path: "/agencies/states",
    pathParams: [],
    previewable: true,
    description: "List all states that have transit agencies, along with agency counts for each.",
    params: [],
  },
  {
    id: "agency-by-id",
    label: "GET /agencies/{ntd_id}",
    method: "GET",
    path: "/agencies/{ntd_id}",
    pathParams: ["ntd_id"],
    previewable: true,
    description: "Get a single transit agency by its NTD ID.",
    params: [
      {
        key: "ntd_id",
        label: "Agency",
        type: "agency-search",
        required: true,
        description: "Search and select an agency by name.",
      },
    ],
  },
  {
    id: "modes",
    label: "GET /modes",
    method: "GET",
    path: "/modes",
    pathParams: [],
    previewable: true,
    description: "List all transit mode types, optionally filtered by category or to modes available for a specific agency.",
    params: [
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "rail", label: "Rail" },
          { value: "non_rail", label: "Non-Rail" },
          { value: "other", label: "Other" },
        ],
      },
      {
        key: "ntd_id",
        label: "Agency",
        type: "agency-search",
        description: "Filter to modes that have data for a specific agency.",
      },
    ],
  },
  {
    id: "ridership",
    label: "GET /ridership",
    method: "GET",
    path: "/ridership",
    pathParams: [],
    previewable: true,
    description: "Query ridership records with filters for agency, mode, type of service, and date range. Returns paginated results.",
    params: [
      {
        key: "ntd_ids",
        label: "Agencies (NTD IDs)",
        type: "agency-multi",
        description: "Search to add agencies. Multiple IDs are comma-separated.",
      },
      {
        key: "mode_codes",
        label: "Mode Codes",
        type: "mode-multi",
        placeholder: "e.g. HR,MB",
        description: "Comma-separated transit mode codes.",
      },
      {
        key: "type_of_service",
        label: "Type of Service",
        type: "select",
        options: [
          { value: "DO", label: "Directly Operated (DO)" },
          { value: "PT", label: "Purchased Transportation (PT)" },
        ],
      },
      { key: "start_year", label: "Start Year", type: "number", placeholder: "2002" },
      { key: "end_year", label: "End Year", type: "number", placeholder: "2024" },
      { key: "start_month", label: "Start Month", type: "number", placeholder: "1" },
      { key: "end_month", label: "End Month", type: "number", placeholder: "12" },
      { key: "page", label: "Page", type: "number", placeholder: "1" },
      { key: "per_page", label: "Per Page", type: "number", placeholder: "50" },
    ],
  },
  {
    id: "ridership-timeseries",
    label: "GET /ridership/timeseries",
    method: "GET",
    path: "/ridership/timeseries",
    pathParams: [],
    previewable: true,
    description: "Time series ridership data for a single agency. Returns monthly data points grouped by mode.",
    params: [
      {
        key: "ntd_id",
        label: "Agency",
        type: "agency-search",
        required: true,
        description: "Required. Search and select a transit agency.",
      },
      {
        key: "mode_codes",
        label: "Mode Codes",
        type: "mode-multi",
        placeholder: "e.g. HR,MB",
        description: "Comma-separated mode codes. Leave blank for all modes.",
      },
      {
        key: "type_of_service",
        label: "Type of Service",
        type: "select",
        options: [
          { value: "DO", label: "Directly Operated (DO)" },
          { value: "PT", label: "Purchased Transportation (PT)" },
        ],
      },
      {
        key: "metric",
        label: "Metric",
        type: "select",
        options: [
          { value: "upt", label: "Unlinked Passenger Trips (UPT)" },
          { value: "vrm", label: "Vehicle Revenue Miles (VRM)" },
          { value: "vrh", label: "Vehicle Revenue Hours (VRH)" },
          { value: "voms", label: "Vehicles Operated Max Service (VOMS)" },
        ],
      },
      { key: "start_year", label: "Start Year", type: "number", placeholder: "2002" },
      { key: "end_year", label: "End Year", type: "number", placeholder: "2024" },
    ],
  },
  {
    id: "ridership-top-agencies",
    label: "GET /ridership/top-agencies",
    method: "GET",
    path: "/ridership/top-agencies",
    pathParams: [],
    previewable: true,
    description: "Get the top transit agencies ranked by Unlinked Passenger Trips (UPT) for a given year.",
    params: [
      { key: "year", label: "Year", type: "number", placeholder: "2024" },
      { key: "limit", label: "Limit", type: "number", placeholder: "10" },
    ],
  },
  {
    id: "ridership-summary",
    label: "GET /ridership/summary",
    method: "GET",
    path: "/ridership/summary",
    pathParams: [],
    previewable: true,
    description: "High-level summary statistics across all ridership data: total agencies, records, date range, and more.",
    params: [],
  },
  {
    id: "export-csv",
    label: "GET /export/csv",
    method: "GET",
    path: "/export/csv",
    pathParams: [],
    previewable: false,
    description: "Download filtered ridership data as a CSV file. Returns a file download, not JSON.",
    params: [
      {
        key: "ntd_ids",
        label: "Agencies (NTD IDs)",
        type: "agency-multi",
        description: "Search to add agencies. Multiple IDs are comma-separated.",
      },
      {
        key: "mode_codes",
        label: "Mode Codes",
        type: "mode-multi",
        placeholder: "e.g. HR,MB",
      },
      { key: "start_year", label: "Start Year", type: "number", placeholder: "2002" },
      { key: "end_year", label: "End Year", type: "number", placeholder: "2024" },
    ],
  },
  {
    id: "export-excel",
    label: "GET /export/excel",
    method: "GET",
    path: "/export/excel",
    pathParams: [],
    previewable: false,
    description: "Download filtered ridership data as an Excel (.xlsx) file. Returns a file download, not JSON.",
    params: [
      {
        key: "ntd_ids",
        label: "Agencies (NTD IDs)",
        type: "agency-multi",
        description: "Search to add agencies. Multiple IDs are comma-separated.",
      },
      {
        key: "mode_codes",
        label: "Mode Codes",
        type: "mode-multi",
        placeholder: "e.g. HR,MB",
      },
      { key: "start_year", label: "Start Year", type: "number", placeholder: "2002" },
      { key: "end_year", label: "End Year", type: "number", placeholder: "2024" },
    ],
  },
]

export function buildUrl(
  base: string,
  config: EndpointConfig,
  values: Record<string, string>
): string {
  let path = config.path
  for (const key of config.pathParams) {
    const val = values[key]?.trim()
    if (val) {
      path = path.replace(`{${key}}`, encodeURIComponent(val))
    }
  }

  const qs = new URLSearchParams()
  for (const param of config.params) {
    if (config.pathParams.includes(param.key)) continue
    const val = values[param.key]?.trim()
    if (val) qs.set(param.key, val)
  }

  const qsStr = qs.toString()
  return `${base}${path}${qsStr ? `?${qsStr}` : ""}`
}
