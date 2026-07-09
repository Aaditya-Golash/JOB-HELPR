# Copies one value out of mcp\.env.local straight to the clipboard, so you
# never have to open the file, find the line, or copy a substring by hand.
#
# Usage (run from anywhere -- this finds .env.local next to this script):
#   .\scripts\copy-env-value.ps1 CONTACT_EMAIL

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Key
)

$envFile = Join-Path $PSScriptRoot "..\.env.local"

if (-not (Test-Path $envFile)) {
    Write-Error "No .env.local found at $envFile. Is mcp\.env.local set up?"
    exit 1
}

$line = Get-Content $envFile | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1

if (-not $line) {
    Write-Error "No value found for '$Key' in .env.local"
    exit 1
}

$value = $line -replace "^$Key=", ""
$value = $value.Trim('"')

Set-Clipboard -Value $value

Write-Host "Copied $Key's value to your clipboard. Go paste it into the Value box now." -ForegroundColor Green
