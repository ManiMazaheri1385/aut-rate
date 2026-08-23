# Seeds your Neon cloud database with sample data.
# Usage: .\seed-neon.ps1  -> paste your Neon connection string when asked.
$ErrorActionPreference = "Stop"

Write-Host "== AUT Rate: setup cloud database ==" -ForegroundColor Cyan
$url = Read-Host "Paste your Neon POOLED connection string (starts with postgresql://)"

if ([string]::IsNullOrWhiteSpace($url)) {
  Write-Host "No connection string entered. Aborted." -ForegroundColor Red
  exit 1
}

if ($url -notmatch "-pooler") {
  Write-Host "Warning: this does not look like the POOLED string (it should contain '-pooler')." -ForegroundColor Yellow
}

$env:DATABASE_URL = $url

Write-Host "`n[1/2] Creating tables..." -ForegroundColor Green
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n[2/2] Seeding Persian sample data..." -ForegroundColor Green
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`nDone! Your cloud database is ready." -ForegroundColor Cyan
