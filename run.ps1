#!/usr/bin/env pwsh
# Run User Service directly (without Dapr)
# Usage: .\run.ps1

Write-Host "Starting User Service (Direct mode - no Dapr)..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:1002" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:1002/health" -ForegroundColor Cyan
Write-Host ""

npm run dev
