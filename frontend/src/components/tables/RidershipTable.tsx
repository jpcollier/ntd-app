"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { RidershipFact } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"

interface RidershipTableProps {
  data: RidershipFact[]
  agencyMap?: Map<number, string>
}

const columnHelper = createColumnHelper<RidershipFact>()

const MODE_NAMES: Record<string, string> = {
  MB: "Bus", RB: "Bus Rapid Transit", CB: "Commuter Bus", DR: "Demand Response",
  DT: "Demand Response Taxi", FB: "Ferryboat", PB: "Publico", TB: "Trolleybus",
  VP: "Vanpool", TR: "Aerial Tramway", AR: "Alaska Railroad", CC: "Cable Car",
  CR: "Commuter Rail", HR: "Heavy Rail", YR: "Hybrid Rail", IP: "Inclined Plane",
  LR: "Light Rail", MG: "Monorail/Automated Guideway", OR: "Other Rail", SR: "Streetcar Rail",
}

const TOS_NAMES: Record<string, string> = {
  DO: "Directly Operated",
  PT: "Purchased Transportation",
}

export function RidershipTable({ data, agencyMap }: RidershipTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = [
    columnHelper.accessor("agency_id", {
      header: "Agency",
      cell: (info) => agencyMap?.get(info.getValue()) || info.getValue(),
    }),
    columnHelper.accessor("mode_code", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mode
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: (info) => {
        const code = info.getValue()
        return MODE_NAMES[code] ? `${MODE_NAMES[code]} (${code})` : code
      },
    }),
    columnHelper.accessor("type_of_service", {
      header: "Type of Service",
      cell: (info) => {
        const tos = info.getValue()
        return TOS_NAMES[tos] ?? tos
      },
    }),
    columnHelper.accessor("year", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Year
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    }),
    columnHelper.accessor("month", {
      header: "Month",
    }),
    columnHelper.accessor("upt", {
      header: "Unlinked Passenger Trips",
      cell: (info) => {
        const val = info.getValue()
        return val != null ? val.toLocaleString() : "-"
      },
    }),
    columnHelper.accessor("vrm", {
      header: "Vehicle Revenue Miles",
      cell: (info) => {
        const val = info.getValue()
        return val != null ? val.toLocaleString() : "-"
      },
    }),
    columnHelper.accessor("vrh", {
      header: "Vehicle Revenue Hours",
      cell: (info) => {
        const val = info.getValue()
        return val != null ? val.toLocaleString() : "-"
      },
    }),
    columnHelper.accessor("voms", {
      header: "Vehicles Operated in Max Service",
      cell: (info) => {
        const val = info.getValue()
        return val != null ? val.toLocaleString() : "-"
      },
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by mode..."
          value={(table.getColumn("mode_code")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("mode_code")?.setFilterValue(e.target.value)
          }
          className="max-w-xs"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
