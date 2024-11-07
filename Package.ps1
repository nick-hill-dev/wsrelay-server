$ErrorActionPreference = "Stop"

$targetPath = "$PSScriptRoot\build"
If (Test-Path $targetPath) {
    Remove-Item $targetPath -Recurse
}

New-Item -ItemType Directory -Path $targetPath -ErrorAction SilentlyContinue | Out-Null

& tsc -b

Copy-Item "bin/*" $targetPath

New-Item -ItemType Directory -Path "$targetPath/config" -ErrorAction SilentlyContinue | Out-Null

Copy-Item "config/*" "$targetPath/config"

New-Item -ItemType Directory -Path "$targetPath/data" -ErrorAction SilentlyContinue | Out-Null