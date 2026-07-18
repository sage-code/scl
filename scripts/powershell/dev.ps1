param(
    [int]$Port = 4173
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

node build.js
python scripts/python/validate_site.py

Write-Host "Serving ./public on http://localhost:$Port"
python -m http.server $Port --directory public
