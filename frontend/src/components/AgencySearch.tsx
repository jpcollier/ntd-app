"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAgencySearch } from "@/hooks/useApi"

interface AgencySearchProps {
  onSelect: (ntdId: string) => void
  placeholder?: string
}

export function AgencySearch({ onSelect, placeholder = "Search for a transit agency..." }: AgencySearchProps) {
  const [inputValue, setInputValue] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounce input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(inputValue), 300)
    return () => clearTimeout(id)
  }, [inputValue])

  // Open dropdown when there's a query
  useEffect(() => {
    setIsOpen(debouncedQuery.trim().length > 0)
    setActiveIndex(-1)
  }, [debouncedQuery])

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  const { data, isLoading } = useAgencySearch(debouncedQuery)
  const agencies = data?.items ?? []

  function handleSelect(ntdId: string) {
    onSelect(ntdId)
    setInputValue("")
    setDebouncedQuery("")
    setIsOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, agencies.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && agencies[activeIndex]) {
        handleSelect(agencies[activeIndex].ntd_id)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-10 h-12 text-base"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (debouncedQuery.trim().length > 0) setIsOpen(true) }}
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
          ) : agencies.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No agencies found</div>
          ) : (
            agencies.map((agency, i) => (
              <div
                key={agency.ntd_id}
                role="option"
                aria-selected={i === activeIndex}
                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                  i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(agency.ntd_id) }}
              >
                <p className="font-medium">{agency.name}</p>
                {(agency.city || agency.state) && (
                  <p className="text-xs text-muted-foreground">
                    {[agency.city, agency.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
