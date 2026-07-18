$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

node build.js
python scripts/python/validate_site.py
Write-Host "Local test checks passed."
