$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$setupScript = Join-Path $PSScriptRoot "setup-local.ps1"

& $setupScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apiPath = Join-Path $projectRoot "apps\api"
$webPath = Join-Path $projectRoot "apps\web"
Start-Process powershell.exe -ArgumentList @("-NoExit", "-Command", "Set-Location '$apiPath'; npm run start:dev")
Start-Process powershell.exe -ArgumentList @("-NoExit", "-Command", "Set-Location '$webPath'; `$env:NEXT_PUBLIC_API_URL='http://localhost:3001'; npm run dev")

Write-Host "RiTech API and web dev servers are starting in separate PowerShell windows."
