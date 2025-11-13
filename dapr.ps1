#!/usr/bin/env pwsh
# Run User Service with Dapr sidecar
# Usage: .\dapr.ps1

Write-Host "Starting User Service with Dapr..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:1002" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:1002/health" -ForegroundColor Cyan
Write-Host "Dapr HTTP endpoint: http://localhost:3502" -ForegroundColor Cyan
Write-Host "Dapr gRPC endpoint: localhost:50002" -ForegroundColor Cyan
Write-Host ""

dapr run `
  --app-id user-service `
  --app-port 1002 `
  --dapr-http-port 3502 `
  --dapr-grpc-port 50002 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn `
  -- node src/server.js
