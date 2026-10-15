<#
.SYNOPSIS
    Writes the SQL to bring any Shikho English database up to date, for review before it is applied.

.DESCRIPTION
    Generates an idempotent migration script (each migration runs only if it has not been applied yet)
    and copies the Supabase lock-down script next to it. Nothing is applied to any database.

    Apply them, in this order, after reviewing them:
        1. migrate.sql             (Supabase SQL editor, or: psql "<connection string>" -f migrate.sql)
        2. supabase-lockdown.sql   (only for Supabase or other hosts that expose a Data API)

.EXAMPLE
    ./scripts/New-MigrationScript.ps1
    ./scripts/New-MigrationScript.ps1 -OutputDirectory release-sql
#>
param(
    [string]$OutputDirectory = "artifacts"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $repoRoot $OutputDirectory
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

$migrationFile = Join-Path $outputPath "migrate.sql"
& dotnet ef migrations script --idempotent --project (Join-Path $repoRoot "Backend") --output $migrationFile
if ($LASTEXITCODE -ne 0) { throw "dotnet ef migrations script failed with exit code $LASTEXITCODE" }

Copy-Item (Join-Path $repoRoot "Backend/Database/supabase-lockdown.sql") (Join-Path $outputPath "supabase-lockdown.sql") -Force

Write-Host "Wrote:"
Write-Host "  $migrationFile"
Write-Host "  $(Join-Path $outputPath 'supabase-lockdown.sql')"
Write-Host "Review both files, then apply migrate.sql followed by supabase-lockdown.sql."
