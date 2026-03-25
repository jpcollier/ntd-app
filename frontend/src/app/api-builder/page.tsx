"use client"

import { useState, useMemo } from "react"
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
import { AgencySearch } from "@/components/AgencySearch"
import { useAgency } from "@/hooks/useApi"
import { ENDPOINTS, buildUrl, EndpointConfig } from "@/lib/api-builder-config"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; message: string }

function buildCurlSnippet(url: string): string {
  return `curl -X GET "${url}" \\\n  -H "Accept: application/json"`
}

function buildPythonSnippet(url: string): string {
  return `import requests\n\nresponse = requests.get("${url}")\ndata = response.json()\nprint(data)`
}

function buildJsSnippet(url: string): string {
  return `const response = await fetch("${url}");\nconst data = await response.json();\nconsole.log(data);`
}

// Displays the resolved agency name for agency-search fields
function AgencyLabel({ ntdId }: { ntdId: string }) {
  const { data: agency } = useAgency(ntdId)
  if (!ntdId || !agency) return null
  return (
    <p className="text-xs text-muted-foreground mt-1">
      Selected: <span className="font-medium text-foreground">{agency.name}</span> ({ntdId})
    </p>
  )
}

export default function ApiBuilderPage() {
  const [selectedEndpointId, setSelectedEndpointId] = useState("agencies")
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [activeSnippetTab, setActiveSnippetTab] = useState("curl")
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "idle" })

  const selectedEndpoint = ENDPOINTS.find((e) => e.id === selectedEndpointId) as EndpointConfig

  const generatedUrl = useMemo(
    () => buildUrl(API_BASE, selectedEndpoint, paramValues),
    [selectedEndpoint, paramValues]
  )

  const missingRequired = selectedEndpoint.params
    .filter((p) => p.required && !paramValues[p.key]?.trim())
    .map((p) => p.label)

  const canFetch = selectedEndpoint.previewable && missingRequired.length === 0

  function handleEndpointChange(id: string) {
    setSelectedEndpointId(id)
    setParamValues({})
    setPreviewState({ status: "idle" })
  }

  function handleParamChange(key: string, value: string) {
    setParamValues((prev) => ({ ...prev, [key]: value }))
    setPreviewState({ status: "idle" })
  }

  function handleAgencySelect(key: string, ntdId: string) {
    setParamValues((prev) => ({ ...prev, [key]: ntdId }))
    setPreviewState({ status: "idle" })
  }

  function handleAgencyMultiSelect(key: string, ntdId: string) {
    setParamValues((prev) => {
      const current = prev[key] ?? ""
      const existing = current.split(",").map((s) => s.trim()).filter(Boolean)
      if (existing.includes(ntdId)) return prev
      return { ...prev, [key]: [...existing, ntdId].join(",") }
    })
    setPreviewState({ status: "idle" })
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(generatedUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  async function handleCopySnippet() {
    const snippets: Record<string, string> = {
      curl: buildCurlSnippet(generatedUrl),
      python: buildPythonSnippet(generatedUrl),
      js: buildJsSnippet(generatedUrl),
    }
    await navigator.clipboard.writeText(snippets[activeSnippetTab] ?? "")
    setCopiedSnippet(true)
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  async function handleFetchPreview() {
    if (!canFetch) return
    setPreviewState({ status: "loading" })
    try {
      const response = await fetch(generatedUrl)
      if (!response.ok) {
        const text = await response.text()
        setPreviewState({ status: "error", message: `HTTP ${response.status}: ${text}` })
        return
      }
      const data = await response.json()
      setPreviewState({ status: "success", data })
    } catch (e) {
      setPreviewState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      })
    }
  }

  function renderPreviewJson(data: unknown): string {
    const json = JSON.stringify(data, null, 2)
    if (json.length > 12000) {
      return json.slice(0, 12000) + "\n\n// ... response truncated for display"
    }
    return json
  }

  return (
    <div className="container py-8">
      <div className="mb-8 pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">API Builder</h1>
        <p className="text-muted-foreground mt-2">
          Build and explore API endpoint URLs interactively.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left column: endpoint selector + param form */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedEndpointId} onValueChange={handleEndpointChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map((ep) => (
                    <SelectItem key={ep.id} value={ep.id}>
                      {ep.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedEndpoint.description}
              </p>
            </CardContent>
          </Card>

          {selectedEndpoint.params.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedEndpoint.params.map((param) => (
                  <div key={param.key} className="space-y-1">
                    <Label className="text-sm">
                      {param.label}
                      {param.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>

                    {param.type === "agency-search" && (
                      <>
                        <AgencySearch
                          placeholder="Search agencies..."
                          onSelect={(ntdId) => handleAgencySelect(param.key, ntdId)}
                        />
                        <AgencyLabel ntdId={paramValues[param.key] ?? ""} />
                      </>
                    )}

                    {param.type === "agency-multi" && (
                      <>
                        <AgencySearch
                          placeholder="Search to add agency..."
                          onSelect={(ntdId) => handleAgencyMultiSelect(param.key, ntdId)}
                        />
                        <Input
                          value={paramValues[param.key] ?? ""}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                          placeholder="NTD IDs (comma-separated)"
                          className="text-xs font-mono"
                        />
                      </>
                    )}

                    {param.type === "select" && (
                      <Select
                        value={paramValues[param.key] ?? ""}
                        onValueChange={(v) => handleParamChange(param.key, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {(param.type === "text" || param.type === "number" || param.type === "mode-multi") && (
                      <Input
                        type={param.type === "number" ? "number" : "text"}
                        value={paramValues[param.key] ?? ""}
                        onChange={(e) => handleParamChange(param.key, e.target.value)}
                        placeholder={param.placeholder}
                      />
                    )}

                    {param.description && (
                      <p className="text-xs text-muted-foreground">{param.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: URL, snippets, preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Generated URL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generated URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">
                {generatedUrl}
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                {copiedUrl ? "Copied!" : "Copy URL"}
              </Button>
            </CardContent>
          </Card>

          {/* Code Snippets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Code Snippets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs
                value={activeSnippetTab}
                onValueChange={setActiveSnippetTab}
              >
                <TabsList>
                  <TabsTrigger value="curl">curl</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <pre className="rounded-md border bg-muted px-4 py-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {buildCurlSnippet(generatedUrl)}
                  </pre>
                </TabsContent>
                <TabsContent value="python">
                  <pre className="rounded-md border bg-muted px-4 py-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                    {buildPythonSnippet(generatedUrl)}
                  </pre>
                </TabsContent>
                <TabsContent value="js">
                  <pre className="rounded-md border bg-muted px-4 py-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                    {buildJsSnippet(generatedUrl)}
                  </pre>
                </TabsContent>
              </Tabs>
              <Button variant="outline" size="sm" onClick={handleCopySnippet}>
                {copiedSnippet ? "Copied!" : "Copy Snippet"}
              </Button>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEndpoint.previewable ? (
                <>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleFetchPreview}
                      disabled={!canFetch || previewState.status === "loading"}
                      size="sm"
                    >
                      {previewState.status === "loading" ? "Fetching..." : "Fetch Preview"}
                    </Button>
                    {missingRequired.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Required: {missingRequired.join(", ")}
                      </p>
                    )}
                  </div>

                  {previewState.status === "idle" && (
                    <p className="text-sm text-muted-foreground italic">
                      Click Fetch Preview to see a live response.
                    </p>
                  )}

                  {previewState.status === "loading" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Loading response...
                    </div>
                  )}

                  {previewState.status === "error" && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {previewState.message}
                    </div>
                  )}

                  {previewState.status === "success" && (
                    <pre className="rounded-md border bg-muted px-4 py-3 text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                      {renderPreviewJson(previewState.data)}
                    </pre>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This endpoint returns a file download rather than JSON — preview is not available.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(generatedUrl, "_blank")}
                  >
                    Open / Download File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
