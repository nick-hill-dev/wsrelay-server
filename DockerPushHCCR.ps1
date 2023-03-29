$ErrorActionPreference = "Stop"

# Push to Hill Cloud Container Registry

Write-Host "> tsc" -ForegroundColor Cyan
& tsc -b

Write-Host "> docker build" -ForegroundColor Cyan
& docker build -t wsrelay:latest . --platform linux/arm64/v8

Write-Host "> docker login" -ForegroundColor Cyan
& docker login containers

Write-Host "> docker tag" -ForegroundColor Cyan
& docker tag wsrelay:latest containers:443/wsrelay:latest

Write-Host "> docker push" -ForegroundColor Cyan
& docker push containers:443/wsrelay:latest

# docker pull containers:443/wsrelay:latest & docker run -d -p 22002:22002 --restart=always --name wsrelay containers:443/wsrelay:latest