param(
    [switch]$Apply,
    [ValidateSet("copy", "move")]
    [string]$Mode = "copy"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

$folders = @(
    "assets",
    "assets/css",
    "assets/js",
    "assets/images",
    "content",
    "content/labs",
    "layouts",
    "public",
    "scripts",
    "scripts/python",
    "scripts/powershell",
    "tests",
    "config"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
}

$pyArgs = @("scripts/python/migrate_to_static_structure.py", "--mode", $Mode)
if ($Apply) {
    $pyArgs += "--apply"
}

python @pyArgs
python scripts/python/migration_status_report.py
Write-Host "Migration prep completed."
