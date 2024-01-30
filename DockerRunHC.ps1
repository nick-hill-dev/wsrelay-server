Param (
    [string] $Name = "wsrelay",
    [switch] $Follow,
    [switch] $Exec
)

$ErrorActionPreference = "Stop"

# Run from Docker installed in Hill Cloud

Write-Host "> docker pull" -ForegroundColor Cyan
& docker -H containers pull hccr.nick-hill.com/$($Name):latest

Write-Host "> docker stop" -ForegroundColor Cyan
& docker -H containers stop $Name

Write-Host "> docker rm" -ForegroundColor Cyan
& docker -H containers rm $Name

Write-Host "> docker run" -ForegroundColor Cyan
& docker -H containers run -d `
    --restart=always `
    --name $Name `
    -p 22002:22002 `
    hccr.nick-hill.com/$($Name):latest

If ($Follow) {
    Write-Host "> docker logs" -ForegroundColor Cyan
    & docker -H containers logs $Name --follow
}
ElseIf ($Exec) {
    Write-Host "> docker exec" -ForegroundColor Cyan
    & docker -H containers exec -it $Name bash
}