$ErrorActionPreference = "Stop"

# Push to Hill Cloud Container Registry

Write-Host "> npm run build" -ForegroundColor Cyan
& npm run build

Write-Host "> docker build" -ForegroundColor Cyan
& docker build -t wsrelay:latest . --platform linux/arm64/v8

Write-Host "> docker login" -ForegroundColor Cyan
& docker login hccr.nick-hill.com

Write-Host "> docker tag" -ForegroundColor Cyan
& docker tag wsrelay:latest hccr.nick-hill.com/wsrelay:latest

Write-Host "> docker push" -ForegroundColor Cyan
& docker push hccr.nick-hill.com/wsrelay:latest