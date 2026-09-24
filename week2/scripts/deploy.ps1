param(
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment = "dev",   # dev | test | prod
    [string]$ProjectName = "twin"
)
$ErrorActionPreference = "Stop"

# Windows PowerShell no convierte los errores de programas externos en excepciones.
function Invoke-CheckedCommand {
    param(
        [string]$Command,
        [string[]]$Arguments
    )
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command ha fallado con codigo de salida $LASTEXITCODE."
    }
}

$WeekRoot = Split-Path $PSScriptRoot -Parent
$BackendPath = Join-Path $WeekRoot "day1/twin/backend"
$FrontendPath = Join-Path $WeekRoot "day1/twin/frontend"
$TerraformPath = Join-Path $WeekRoot "terraform"
$StartingLocation = Get-Location

try {
    foreach ($RequiredPath in @($BackendPath, $FrontendPath, $TerraformPath)) {
        if (-not (Test-Path -LiteralPath $RequiredPath -PathType Container)) {
            throw "No se encuentra el directorio requerido: $RequiredPath"
        }
    }
    
    Write-Host "Desplegando $ProjectName en $Environment ..." -ForegroundColor Green
    
    # 1. Construir el paquete Lambda
    Write-Host "Construyendo paquete Lambda..." -ForegroundColor Yellow
    Set-Location -LiteralPath $BackendPath
    Invoke-CheckedCommand "uv" @("run", "deploy.py")
    
    # 2. Workspace y terraform apply
    Set-Location -LiteralPath $TerraformPath
    Invoke-CheckedCommand "terraform" @("init", "-input=false")

    $Workspaces = Invoke-CheckedCommand "terraform" @("workspace", "list", "-no-color")
    $WorkspaceNames = @($Workspaces | ForEach-Object { ($_ -replace '^\s*\*?\s*', '').Trim() })
    if ($WorkspaceNames -cnotcontains $Environment) {
        Invoke-CheckedCommand "terraform" @("workspace", "new", $Environment)
    } else {
        Invoke-CheckedCommand "terraform" @("workspace", "select", $Environment)
    }

    if ($Environment -eq "prod") {
        Invoke-CheckedCommand "terraform" @("apply", "-var-file=prod.tfvars", "-var=project_name=$ProjectName", "-var=environment=$Environment", "-auto-approve")
    } else {
        Invoke-CheckedCommand "terraform" @("apply", "-var=project_name=$ProjectName", "-var=environment=$Environment", "-auto-approve")
    }

    $ApiUrl = Invoke-CheckedCommand "terraform" @("output", "-raw", "api_gateway_url")
    $FrontendBucket = Invoke-CheckedCommand "terraform" @("output", "-raw", "s3_frontend_bucket")
    try { $CustomUrl = Invoke-CheckedCommand "terraform" @("output", "-raw", "custom_domain_url") } catch { $CustomUrl = "" }
    
    # 3. Construir y desplegar el frontend
    Set-Location -LiteralPath $FrontendPath
    
    # Crear archivo .env.production con el URL de la API
    Write-Host "Definiendo API URL para producción..." -ForegroundColor Yellow
    "NEXT_PUBLIC_API_URL=$ApiUrl" | Out-File .env.production -Encoding utf8
    
    Invoke-CheckedCommand "npm" @("install")
    Invoke-CheckedCommand "npm" @("run", "build")
    Invoke-CheckedCommand "aws" @("s3", "sync", ".\out", "s3://$FrontendBucket/", "--delete")
    
    # 4. Resumen final
    Set-Location -LiteralPath $TerraformPath
    $CfUrl = Invoke-CheckedCommand "terraform" @("output", "-raw", "cloudfront_url")
    Write-Host "¡Despliegue completo!" -ForegroundColor Green
    Write-Host "CloudFront URL : $CfUrl" -ForegroundColor Cyan
    if ($CustomUrl) {
        Write-Host "Dominio personalizado  : $CustomUrl" -ForegroundColor Cyan
    }
    Write-Host "API Gateway    : $ApiUrl" -ForegroundColor Cyan
} finally {
    Set-Location -LiteralPath $StartingLocation.Path
}
