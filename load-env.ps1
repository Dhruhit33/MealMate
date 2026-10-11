# load-env.ps1 — Run this ONCE before starting any service
# Usage: .\load-env.ps1

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found at $envFile" -ForegroundColor Red
    Write-Host "Copy .env.example to .env and fill in your values" -ForegroundColor Yellow
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        Write-Host "  SET $key" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Environment loaded! Now start your services." -ForegroundColor Cyan
