param(
    [ValidateSet('start', 'stop', 'status', 'credentials')]
    [string]$Mode = 'start',
    [ValidateRange(1024, 65535)]
    [int]$Port = 8080
)
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$secretFolder = Join-Path $workspace '.docker/secrets'
$secretNames = @('database-root-password', 'database-password', 'starter-password')
$env:GATEPILOT_PORT = [string]$Port

function Invoke-Docker([string[]]$Arguments) {
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'Docker command failed. Check the message above.' }
}
function New-LocalSecrets {
    $existing = @($secretNames | Where-Object { Test-Path -LiteralPath (Join-Path $secretFolder $_) })
    if ($existing.Count -eq $secretNames.Count) { return }
    if ($existing.Count -gt 0) { throw 'Some secret files are missing. Restore the original files before starting the existing database.' }
    $existingVolume = & docker volume ls --filter 'name=^gatepilot-mongodb-data$' --format '{{.Name}}'
    if ($LASTEXITCODE -ne 0) { throw 'Cannot check the existing database volume.' }
    if ($existingVolume) { throw 'The database volume already exists. Restore its original secret files before starting.' }
    [void](New-Item -ItemType Directory -Path $secretFolder -Force)
    if ([Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT) {
        $acl = New-Object System.Security.AccessControl.DirectorySecurity
        $acl.SetAccessRuleProtection($true, $false)
        $identities = @(
            [Security.Principal.WindowsIdentity]::GetCurrent().User,
            [Security.Principal.SecurityIdentifier]::new('S-1-5-18'),
            [Security.Principal.SecurityIdentifier]::new('S-1-5-32-544')
        )
        foreach ($identity in $identities) {
            $rule = [Security.AccessControl.FileSystemAccessRule]::new(
                $identity, 'FullControl', 'ContainerInherit, ObjectInherit', 'None', 'Allow'
            )
            [void]$acl.AddAccessRule($rule)
        }
        Set-Acl -LiteralPath $secretFolder -AclObject $acl
    }
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        foreach ($name in $secretNames) {
            $bytes = New-Object byte[] 24
            $random.GetBytes($bytes)
            $value = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
            if ($name -eq 'starter-password') { $value = 'GatePilot-9-' + $value }
            [IO.File]::WriteAllText((Join-Path $secretFolder $name), $value, [Text.UTF8Encoding]::new($false))
        }
    } finally { $random.Dispose() }
}
function Show-Credentials {
    $passwordFile = Join-Path $secretFolder 'starter-password'
    if (!(Test-Path -LiteralPath $passwordFile)) { throw 'Start Docker once to create local credentials.' }
    Write-Host 'Starter accounts: admin@preview.test, officer@preview.test, manager@preview.test'
    Write-Host ('Initial password: ' + [IO.File]::ReadAllText($passwordFile).Trim())
    Write-Host 'Existing account passwords are preserved across restarts.'
}
if (!(Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Install Docker Desktop with Linux containers first.' }
Push-Location $workspace
try {
    switch ($Mode) {
        start {
            $engine = & docker info --format '{{.OSType}}' 2>$null
            if ($LASTEXITCODE -ne 0 -or $engine -ne 'linux') { throw 'Start Docker Desktop with its Linux engine, then try again.' }
            New-LocalSecrets
            Invoke-Docker @('compose', 'config', '--quiet')
            Invoke-Docker @('compose', 'up', '--build', '--detach', '--wait', '--wait-timeout', '180')
            Write-Host ("GatePilot is ready at http://localhost:$Port")
            Show-Credentials
        }
        stop { Invoke-Docker @('compose', 'down'); Write-Host 'Containers stopped. Database data and credentials are preserved.' }
        status { Invoke-Docker @('compose', 'ps', '--all') }
        credentials { Show-Credentials }
    }
} finally { Pop-Location }
