# Starts the portable PostgreSQL server for this project (data lives in .postgres\data).
# Usage: .\start-db.ps1
$root = $PSScriptRoot
& "$root\.postgres\pgsql\bin\pg_isready.exe" -h localhost -p 5432 -q
if ($LASTEXITCODE -eq 0) {
  Write-Host "PostgreSQL is already running." -ForegroundColor Green
  exit 0
}
Start-Process -FilePath "$root\.postgres\pgsql\bin\pg_ctl.exe" `
  -ArgumentList "-D", "`"$root\.postgres\data`"", "-l", "`"$root\.postgres\logfile.txt`"", "start" `
  -WorkingDirectory $root -WindowStyle Hidden
for ($i = 0; $i -lt 15; $i++) {
  Start-Sleep -Milliseconds 800
  & "$root\.postgres\pgsql\bin\pg_isready.exe" -h localhost -p 5432 -q
  if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL started on localhost:5432" -ForegroundColor Green
    exit 0
  }
}
Write-Host "Failed to start PostgreSQL. Check .postgres\logfile.txt" -ForegroundColor Red
exit 1
