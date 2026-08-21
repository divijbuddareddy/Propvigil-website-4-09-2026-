# PropVigil Launcher Script - Invokes server.ps1
$scriptPath = Join-Path (Get-Location) "server.ps1"
if (Test-Path $scriptPath) {
    & $scriptPath
} else {
    Write-Host "Error: server.ps1 not found in $(Get-Location)" -ForegroundColor Red
}
