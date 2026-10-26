param(
    [ValidateSet(
        'web', 'api', 'demo', 'test', 'install', 'build',
        'docker', 'docker-stop', 'docker-status', 'docker-credentials'
    )]
    [string]$Mode = 'web'
)
$ErrorActionPreference = 'Stop'
$workspace = $PSScriptRoot

if ($Mode -like 'docker*') {
    $dockerModes = @{
        'docker' = 'start'
        'docker-stop' = 'stop'
        'docker-status' = 'status'
        'docker-credentials' = 'credentials'
    }
    & (Join-Path $workspace 'scripts/Start-Docker.ps1') -Mode $dockerModes[$Mode]
    return
}

$nodePath = (Get-Command node -ErrorAction Stop).Source
$npmCli = Join-Path (Split-Path $nodePath) 'node_modules/npm/bin/npm-cli.js'
if (!(Test-Path -LiteralPath $npmCli)) {
    throw 'A complete Node.js installation is required. Install Node 22 LTS or newer.'
}
$env:npm_config_cache = Join-Path $env:TEMP 'gatepilot-package-cache'

function Invoke-Package([string]$Folder, [string[]]$Arguments) {
    Push-Location (Join-Path $workspace $Folder)
    try {
        & $nodePath $npmCli @Arguments
        if ($LASTEXITCODE -ne 0) { throw "Command failed in $Folder" }
    } finally { Pop-Location }
}

switch ($Mode) {
    install {
        Invoke-Package 'backend' @('ci')
        Invoke-Package 'frontend' @('ci')
    }
    api { Invoke-Package 'backend' @('start') }
    demo { Invoke-Package 'backend' @('run', 'demo') }
    test {
        Invoke-Package 'backend' @('test')
        Invoke-Package 'frontend' @('run', 'lint')
        Invoke-Package 'frontend' @('test')
    }
    build {
        Invoke-Package 'frontend' @('run', 'build')
        Invoke-Package 'frontend' @('run', 'build:mobile')
    }
    web { Invoke-Package 'frontend' @('run', 'web') }
}
