"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export default function ApiDocsPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8 pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Public REST API for accessing FTA ridership data. No authentication required.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="bg-muted px-2 py-1 rounded text-sm">{API_BASE}</code>
          <p className="text-sm text-muted-foreground mt-2">
            For interactive API documentation, visit{" "}
            <a
              href={`${API_BASE}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Swagger UI
            </a>
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="agencies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agencies">Agencies</TabsTrigger>
          <TabsTrigger value="modes">Modes</TabsTrigger>
          <TabsTrigger value="ridership">Ridership</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="agencies">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /agencies</CardTitle>
                <CardDescription>List all transit agencies with pagination and filtering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Query Parameters</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Parameter</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2"><code>state</code></td>
                        <td className="py-2">string</td>
                        <td className="py-2">Filter by state code (e.g., CA, NY)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>search</code></td>
                        <td className="py-2">string</td>
                        <td className="py-2">Search agency name</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>page</code></td>
                        <td className="py-2">integer</td>
                        <td className="py-2">Page number (default: 1)</td>
                      </tr>
                      <tr>
                        <td className="py-2"><code>per_page</code></td>
                        <td className="py-2">integer</td>
                        <td className="py-2">Items per page (default: 50, max: 500)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Example</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`GET ${API_BASE}/agencies?state=CA&page=1&per_page=10

{
  "items": [
    {
      "id": 1,
      "ntd_id": "90001",
      "name": "Los Angeles County Metropolitan Transportation Authority",
      "city": "Los Angeles",
      "state": "CA",
      "uza_name": "Los Angeles-Long Beach-Anaheim, CA",
      ...
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 10,
  "pages": 15
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /agencies/{"{ntd_id}"}</CardTitle>
                <CardDescription>Get a single agency by NTD ID</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`GET ${API_BASE}/agencies/90001

{
  "id": 1,
  "ntd_id": "90001",
  "name": "Los Angeles County Metropolitan Transportation Authority",
  "city": "Los Angeles",
  "state": "CA",
  ...
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GET /modes</CardTitle>
              <CardDescription>List all transit modes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Query Parameters</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Parameter</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2"><code>category</code></td>
                      <td className="py-2">string</td>
                      <td className="py-2">Filter by category: rail, non_rail, other</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`GET ${API_BASE}/modes

[
  { "code": "HR", "name": "Heavy Rail", "category": "rail" },
  { "code": "LR", "name": "Light Rail", "category": "rail" },
  { "code": "MB", "name": "Bus", "category": "non_rail" },
  ...
]`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ridership">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /ridership</CardTitle>
                <CardDescription>Query ridership data with filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Query Parameters</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Parameter</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2"><code>ntd_ids</code></td>
                        <td className="py-2">string</td>
                        <td className="py-2">Comma-separated NTD IDs</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>mode_codes</code></td>
                        <td className="py-2">string</td>
                        <td className="py-2">Comma-separated mode codes</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>start_year</code></td>
                        <td className="py-2">integer</td>
                        <td className="py-2">Start year (min: 2002)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>end_year</code></td>
                        <td className="py-2">integer</td>
                        <td className="py-2">End year</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>page</code></td>
                        <td className="py-2">integer</td>
                        <td className="py-2">Page number</td>
                      </tr>
                      <tr>
                        <td className="py-2"><code>per_page</code></td>
                        <td className="py-2">integer</td>
                        <td className="py-2">Items per page (max: 1000)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /ridership/timeseries</CardTitle>
                <CardDescription>Get time series data for charts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Query Parameters</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Parameter</th>
                        <th className="text-left py-2">Required</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2"><code>ntd_id</code></td>
                        <td className="py-2">Yes</td>
                        <td className="py-2">Single NTD ID</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>mode_codes</code></td>
                        <td className="py-2">No</td>
                        <td className="py-2">Comma-separated mode codes</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>metric</code></td>
                        <td className="py-2">No</td>
                        <td className="py-2">upt, vrm, vrh, or voms (default: upt)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>start_year</code></td>
                        <td className="py-2">No</td>
                        <td className="py-2">Start year</td>
                      </tr>
                      <tr>
                        <td className="py-2"><code>end_year</code></td>
                        <td className="py-2">No</td>
                        <td className="py-2">End year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /export/csv</CardTitle>
                <CardDescription>Download filtered data as CSV</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Accepts the same filter parameters as /ridership endpoint.
                  Returns a downloadable CSV file.
                </p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`GET ${API_BASE}/export/csv?ntd_ids=90001&mode_codes=HR&start_year=2020`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GET /export/excel</CardTitle>
                <CardDescription>Download filtered data as Excel</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Accepts the same filter parameters as /ridership endpoint.
                  Returns a downloadable Excel file (.xlsx).
                </p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`GET ${API_BASE}/export/excel?ntd_ids=90001,90002&start_year=2020&end_year=2024`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
