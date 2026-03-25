# ingest_production.ps1
# Loads an FTA Excel file into the production database via a Fly.io proxy tunnel.
#
# Usage:
#   .\scripts\ingest_production.ps1 -File "data\raw\January 2026 Complete Monthly Ridership.xlsx"
#
# Requirements:
#   - flyctl installed and authenticated (fly auth login)
#   - Python virtualenv set up: cd backend && python -m venv .venv && .venv\Scripts\pip install -r requirements.txt

param(
    [Parameter(Mandatory=$true)]
    [string]$File
)

$ErrorActionPreference = "Stop"
$FLY = "$env:USERPROFILE\.fly\bin\fly.exe"

# Resolve the file path
$FilePath = Resolve-Path $File
if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $File"
    exit 1
}

Write-Host "Fetching remote DATABASE_URL..." -ForegroundColor Cyan
$remoteUrl = & $FLY machine exec 1851d7dc414258 "printenv DATABASE_URL" --app ntd-app-api 2>$null |
    Where-Object { $_ -match "^postgres" } |
    Select-Object -First 1

if (-not $remoteUrl) {
    Write-Error "Could not retrieve DATABASE_URL from Fly. Is the API machine running?"
    exit 1
}

# Transform: postgres://user:pass@ntd-app-db.flycast:5432/db?... -> postgresql://user:pass@localhost:5433/db
$localUrl = $remoteUrl `
    -replace '^postgres://', 'postgresql://' `
    -replace '@ntd-app-db\.flycast:5432', '@localhost:5433' `
    -replace '\?.*$', ''

Write-Host "Opening Fly proxy tunnel on localhost:5433..." -ForegroundColor Cyan
$proxy = Start-Process -FilePath $FLY -ArgumentList "proxy 5433:5432 --app ntd-app-db" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

try {
    Write-Host "Running ingestion: $FilePath" -ForegroundColor Cyan

    # Use the backend venv if available, otherwise fall back to system Python
    $python = "python"
    $venvPython = Join-Path $PSScriptRoot "..\backend\.venv\Scripts\python.exe"
    if (Test-Path $venvPython) {
        $python = $venvPython
    }

    Push-Location (Join-Path $PSScriptRoot "..\backend")
    $env:DATABASE_URL = $localUrl
    & $python -m scripts.ingest_data --file $FilePath
    $exitCode = $LASTEXITCODE
    Pop-Location
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
} finally {
    Write-Host "Closing proxy tunnel..." -ForegroundColor Cyan
    Stop-Process -Id $proxy.Id -ErrorAction SilentlyContinue
}

if ($exitCode -ne 0) {
    Write-Error "Ingestion failed with exit code $exitCode"
    exit $exitCode
}

Write-Host "Done." -ForegroundColor Green
