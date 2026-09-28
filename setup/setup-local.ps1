$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$apiEnv = Join-Path $projectRoot "apps\api\.env"
$webEnv = Join-Path $projectRoot "apps\web\.env.local"
$apiExample = Join-Path $projectRoot "apps\api\.env.example"
$webExample = Join-Path $projectRoot "apps\web\.env.example"

Write-Host "RiTech local setup — no credentials are embedded in this script."
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "Install Node.js and npm before running this setup."
}
if (-not (Test-Path $apiEnv)) { Copy-Item $apiExample $apiEnv }
if (-not (Test-Path $webEnv)) { Copy-Item $webExample $webEnv }

if (Select-String -Path $apiEnv -Pattern "<user>|<password>|replace-with-a-long-random-secret" -Quiet) {
    Write-Host "Edit apps/api/.env with your local PostgreSQL URL and a unique JWT_SECRET, then rerun this script."
    exit 2
}

Push-Location $projectRoot
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
    npm run db:push:sprint2
    if ($LASTEXITCODE -ne 0) { throw "Prisma schema push failed." }
    npm run db:seed:sprint2
    if ($LASTEXITCODE -ne 0) { throw "Synthetic development seed failed." }
} finally {
    Pop-Location
}

Write-Host "Local setup is ready. The seed prints a random development password when RITECH_DEMO_PASSWORD is unset."
