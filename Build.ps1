Param (
    [Parameter()][switch] $Docker,
    [Parameter()][switch] $Run
)

$ErrorActionPreference = "Stop"

If (-not (Test-Path "node_modules")) {
    Write-Host "> npm install" -ForegroundColor Cyan
    & npm install
}

Write-Host "> tsc build" -ForegroundColor Cyan
& tsc -b

If ($Run -and -not $Docker) {
    Write-Host "> node run" -ForegroundColor Cyan
    & node "bin/app.js"
}

If ($Docker) {
    Write-Host "> docker build" -ForegroundColor Cyan
    & docker build -t "wsrelay:latest" .
}

If ($Docker -and $Run) {
    Write-Host "> docker run" -ForegroundColor Cyan
    & docker stop wsrelay
    & docker rm wsrelay
    & docker run -d --name wsrelay -p 22002:22002 "wsrelay:latest"
    
    Write-Host "> docker logs" -ForegroundColor Cyan
    & docker logs wsrelay --follow
}