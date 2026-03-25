"use client"

import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useAgencies(params: {
  state?: string
  search?: string
  page?: number
  per_page?: number
}) {
  return useQuery({
    queryKey: ["agencies", params],
    queryFn: () => api.getAgencies(params),
  })
}

export function useAgency(ntdId: string) {
  return useQuery({
    queryKey: ["agency", ntdId],
    queryFn: () => api.getAgency(ntdId),
    enabled: !!ntdId,
  })
}

export function useStates() {
  return useQuery({
    queryKey: ["states"],
    queryFn: api.getStates,
  })
}

export function useModes(params?: { category?: string; ntd_id?: string }) {
  return useQuery({
    queryKey: ["modes", params],
    queryFn: () => api.getModes(params),
  })
}

export function useRidership(params: {
  ntd_ids?: string
  mode_codes?: string
  type_of_service?: string
  start_year?: number
  end_year?: number
  page?: number
  per_page?: number
}) {
  return useQuery({
    queryKey: ["ridership", params],
    queryFn: () => api.getRidership(params),
    enabled: !!(params.ntd_ids || params.mode_codes),
  })
}

export function useTimeseries(params: {
  ntd_id: string
  mode_codes?: string
  type_of_service?: string
  metric?: string
  start_year?: number
  end_year?: number
}) {
  return useQuery({
    queryKey: ["timeseries", params],
    queryFn: () => api.getTimeseries(params),
    enabled: !!params.ntd_id,
  })
}


export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: api.getSummary,
  })
}

export function useTopAgencies(params?: { year?: number; limit?: number }) {
  return useQuery({
    queryKey: ["top-agencies", params],
    queryFn: () => api.getTopAgencies(params),
    staleTime: 1000 * 60 * 10,
  })
}

export function useAgencySearch(search: string) {
  return useQuery({
    queryKey: ["agencies", { search, per_page: 8 }],
    queryFn: () => api.getAgencies({ search, per_page: 8 }),
    enabled: search.trim().length > 0,
    staleTime: 1000 * 30,
  })
}
