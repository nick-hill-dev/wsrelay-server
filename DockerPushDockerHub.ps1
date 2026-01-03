$ErrorActionPreference = "Stop"

# Push to Docker Hub

Write-Host "> npm install" -ForegroundColor Cyan
& npm install

Write-Host "> docker login" -ForegroundColor Cyan
& docker login

Write-Host "> docker build" -ForegroundColor Cyan
& docker buildx create --name multiarch --use
& docker buildx build --platform linux/amd64,linux/arm64/v8 -t nicholashill/wsrelay:2.2 -t nicholashill/wsrelay:latest --push .
