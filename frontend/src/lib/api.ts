const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface Agency {
  id: number;
  ntd_id: string;
  name: string;
  city: string | null;
  state: string | null;
  uza_name: string | null;
  reporter_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyListResponse {
  items: Agency[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface Mode {
  code: string;
  name: string;
  category: string;
}

export interface RidershipFact {
  id: number;
  agency_id: number;
  mode_code: string;
  type_of_service: string;
  year: number;
  month: number;
  upt: number | null;
  vrm: number | null;
  vrh: number | null;
  voms: number | null;
  is_estimated: boolean;
  created_at: string;
}

export interface RidershipListResponse {
  items: RidershipFact[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface TimeSeriesPoint {
  year: number;
  month: number;
  value: number | null;
}

export interface TimeSeriesData {
  agency_name: string;
  ntd_id: string;
  mode_code: string;
  metric: string;
  data: TimeSeriesPoint[];
}


export interface Summary {
  total_agencies: number;
  total_records: number;
  date_range: {
    min_year: number | null;
    max_year: number | null;
    max_month: number | null;
  };
  latest_year_total_upt: number | null;
  active_modes: number;
}

export interface StateCount {
  state: string;
  count: number;
}

export interface TopAgency {
  ntd_id: string;
  name: string;
  city: string | null;
  state: string | null;
  total_upt: number;
  year: number;
}

// API Functions
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function getAgencies(params: {
  state?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<AgencyListResponse> {
  const searchParams = new URLSearchParams();
  if (params.state) searchParams.set("state", params.state);
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.per_page) searchParams.set("per_page", params.per_page.toString());

  return fetchJson(`${API_BASE}/agencies?${searchParams}`);
}

export async function getAgency(ntdId: string): Promise<Agency> {
  return fetchJson(`${API_BASE}/agencies/${ntdId}`);
}

export async function getStates(): Promise<StateCount[]> {
  return fetchJson(`${API_BASE}/agencies/states`);
}

export async function getModes(params?: { category?: string; ntd_id?: string }): Promise<Mode[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.ntd_id) searchParams.set("ntd_id", params.ntd_id);
  const qs = searchParams.toString();
  return fetchJson(`${API_BASE}/modes${qs ? `?${qs}` : ""}`);
}

export async function getRidership(params: {
  ntd_ids?: string;
  mode_codes?: string;
  type_of_service?: string;
  start_year?: number;
  end_year?: number;
  page?: number;
  per_page?: number;
}): Promise<RidershipListResponse> {
  const searchParams = new URLSearchParams();
  if (params.ntd_ids) searchParams.set("ntd_ids", params.ntd_ids);
  if (params.mode_codes) searchParams.set("mode_codes", params.mode_codes);
  if (params.type_of_service) searchParams.set("type_of_service", params.type_of_service);
  if (params.start_year) searchParams.set("start_year", params.start_year.toString());
  if (params.end_year) searchParams.set("end_year", params.end_year.toString());
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.per_page) searchParams.set("per_page", params.per_page.toString());

  return fetchJson(`${API_BASE}/ridership?${searchParams}`);
}

export async function getTimeseries(params: {
  ntd_id: string;
  mode_codes?: string;
  type_of_service?: string;
  metric?: string;
  start_year?: number;
  end_year?: number;
}): Promise<TimeSeriesData[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("ntd_id", params.ntd_id);
  if (params.mode_codes) searchParams.set("mode_codes", params.mode_codes);
  if (params.type_of_service) searchParams.set("type_of_service", params.type_of_service);
  if (params.metric) searchParams.set("metric", params.metric);
  if (params.start_year) searchParams.set("start_year", params.start_year.toString());
  if (params.end_year) searchParams.set("end_year", params.end_year.toString());

  return fetchJson(`${API_BASE}/ridership/timeseries?${searchParams}`);
}

export async function getSummary(): Promise<Summary> {
  return fetchJson(`${API_BASE}/ridership/summary`);
}

export async function getTopAgencies(params?: {
  year?: number;
  limit?: number;
}): Promise<TopAgency[]> {
  const searchParams = new URLSearchParams();
  if (params?.year) searchParams.set("year", params.year.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  const qs = searchParams.toString();
  return fetchJson(`${API_BASE}/ridership/top-agencies${qs ? `?${qs}` : ""}`);
}

export function getExportCsvUrl(params: {
  ntd_ids?: string;
  mode_codes?: string;
  start_year?: number;
  end_year?: number;
}): string {
  const searchParams = new URLSearchParams();
  if (params.ntd_ids) searchParams.set("ntd_ids", params.ntd_ids);
  if (params.mode_codes) searchParams.set("mode_codes", params.mode_codes);
  if (params.start_year) searchParams.set("start_year", params.start_year.toString());
  if (params.end_year) searchParams.set("end_year", params.end_year.toString());

  return `${API_BASE}/export/csv?${searchParams}`;
}

export function getExportExcelUrl(params: {
  ntd_ids?: string;
  mode_codes?: string;
  start_year?: number;
  end_year?: number;
}): string {
  const searchParams = new URLSearchParams();
  if (params.ntd_ids) searchParams.set("ntd_ids", params.ntd_ids);
  if (params.mode_codes) searchParams.set("mode_codes", params.mode_codes);
  if (params.start_year) searchParams.set("start_year", params.start_year.toString());
  if (params.end_year) searchParams.set("end_year", params.end_year.toString());

  return `${API_BASE}/export/excel?${searchParams}`;
}
