# Stops the portable PostgreSQL server for this project.
# Usage: .\stop-db.ps1
$root = $PSScriptRoot
& "$root\.postgres\pgsql\bin\pg_ctl.exe" -D "$root\.postgres\data" stop -m fast
