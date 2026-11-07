$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ImageName = "pm-kanban:latest"
$ContainerName = "pm-kanban-app"
$DataDir = Join-Path $RepoRoot "data"
$EnvFile = Join-Path $RepoRoot ".env"

if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
}

Write-Host "Construyendo imagen Docker $ImageName..."
docker build -t $ImageName $RepoRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$existing = docker ps -aq -f "name=^${ContainerName}$"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if ($existing) {
    Write-Host "Eliminando contenedor previo $ContainerName..."
    docker rm -f $ContainerName | Out-Null
}

$runArgs = @(
    "run", "-d",
    "--name", $ContainerName,
    "-p", "8000:8000",
    "-v", "${DataDir}:/app/data"
)

if (Test-Path $EnvFile) {
    $runArgs += @("--env-file", $EnvFile)
}

$runArgs += $ImageName

Write-Host "Iniciando contenedor $ContainerName en http://localhost:8000 ..."
docker @runArgs | Out-Null
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$maxAttempts = 20
for ($i = 1; $i -le $maxAttempts; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -eq 200) {
            Write-Host "Servidor listo en http://localhost:8000"
            exit 0
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

Write-Error "El servidor no respondio a tiempo. Revisa los logs con: docker logs $ContainerName"
exit 1

