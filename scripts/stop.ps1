$ErrorActionPreference = "Stop"

$ContainerName = "pm-kanban-app"
$existing = docker ps -aq -f "name=^${ContainerName}$"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($existing) {
    Write-Host "Deteniendo y eliminando contenedor $ContainerName..."
    docker rm -f $ContainerName | Out-Null
    Write-Host "Servidor detenido."
} else {
    Write-Host "El contenedor $ContainerName no esta en ejecucion."
}

