# run.ps1 — Build and start the Banking Statement Converter backend (port 8080)
# Platforms: macOS, Ubuntu/Debian Linux, Windows 10+  (requires PowerShell Core 7+ on Mac/Linux)
# Usage:
#   .\run.ps1              — dev mode (Swagger UI at /swagger-ui.html)
#   .\run.ps1 -Prod        — production mode (no Swagger)
#   .\run.ps1 -SkipBuild   — skip Maven build, start from existing classes

param(
    [switch]$Prod,
    [switch]$SkipBuild,
    [int]$WaitSecs = 90
)

$ErrorActionPreference = "Stop"

# ── PS 5.x / Windows PowerShell compat shim ──────────────────────────────────
if ($null -eq (Get-Variable 'IsWindows' -ErrorAction SilentlyContinue)) {
    $IsWindows = $true; $IsMacOS = $false; $IsLinux = $false
}

$ScriptDir   = $PSScriptRoot
$LogDir      = Join-Path $ScriptDir "logs"
$BackendLog  = Join-Path $LogDir "backend.log"
$BackendErr  = Join-Path $LogDir "backend-err.log"
$BuildLog    = Join-Path $LogDir "build.log"
$PidFile     = Join-Path $LogDir "backend.pid"
$BackendPort = 8080
$HealthUrl   = "http://localhost:$BackendPort/actuator/health"
$Profile     = if ($Prod) { "prod" } else { "dev" }

# ── helpers ───────────────────────────────────────────────────────────────────
function Write-Info { param($m) Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Write-Ok   { param($m) Write-Host "[OK]    $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[WARN]  $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "[ERROR] $m" -ForegroundColor Red }

function Test-PortInUse([int]$Port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try { $client.Connect("localhost", $Port); $client.Close(); return $true }
    catch { return $false }
}

function Start-BackgroundProcess {
    param([string]$Command, [string]$WorkDir, [string]$OutLog, [string]$ErrLog)
    if ($IsWindows) {
        return Start-Process "cmd" `
            -ArgumentList "/c", $Command `
            -WorkingDirectory $WorkDir `
            -RedirectStandardOutput $OutLog `
            -RedirectStandardError  $ErrLog `
            -WindowStyle Hidden -PassThru
    } else {
        return Start-Process "bash" `
            -ArgumentList "-c", "$Command >'$OutLog' 2>'$ErrLog'" `
            -WorkingDirectory $WorkDir `
            -NoNewWindow -PassThru
    }
}

function Wait-ForBackend {
    Write-Info "Waiting for backend on port $BackendPort (up to ${WaitSecs}s)..."
    for ($i = 1; $i -le $WaitSecs; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($r.StatusCode -eq 200) { Write-Ok "Backend is up after ${i}s"; return }
        } catch {}
        Start-Sleep -Seconds 1
    }
    Write-Err "Backend did not start within ${WaitSecs}s — check $BackendLog"
    exit 1
}

# ── banner ────────────────────────────────────────────────────────────────────
$platform = if ($IsWindows) { "Windows" } elseif ($IsMacOS) { "macOS" } else { "Linux" }
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║       Banking Statement Converter — Backend Launcher         ║" -ForegroundColor Magenta
Write-Host "║  Platform : $($platform.PadRight(49))║" -ForegroundColor Magenta
Write-Host "║  Profile  : $($Profile.PadRight(49))║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ── pre-flight ────────────────────────────────────────────────────────────────
foreach ($cmd in @("java", "mvn")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Err "Required command not found: $cmd"
        exit 1
    }
}

if (Test-PortInUse $BackendPort) {
    Write-Warn "Port $BackendPort already in use — run kill.ps1 first."
    exit 1
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# ── 1. Maven build ────────────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Info "Building project (skipping tests)..."
    Set-Location $ScriptDir
    $buildLines = & mvn clean package -DskipTests 2>&1
    $buildLines | Out-File -FilePath $BuildLog -Encoding utf8
    $buildLines | Where-Object { $_ -match '(BUILD|ERROR|\[ERROR\])' } | ForEach-Object { Write-Host $_ }

    if (-not ($buildLines | Where-Object { $_ -match 'BUILD SUCCESS' })) {
        Write-Err "Maven build failed — see $BuildLog"
        exit 1
    }
    Write-Ok "Build complete"
} else {
    Write-Info "Skipping build (-SkipBuild)"
}

# ── 2. Start backend ──────────────────────────────────────────────────────────
Write-Info "Starting Spring Boot backend (profile: $Profile, port: $BackendPort)..."
Set-Location $ScriptDir

$mvnArgs = "spring-boot:run"
if ($Profile -eq "dev") {
    $mvnArgs += " -Dspring-boot.run.profiles=dev"
}

$proc = Start-BackgroundProcess -Command "mvn $mvnArgs" -WorkDir $ScriptDir `
                                -OutLog $BackendLog -ErrLog $BackendErr
$proc.Id | Out-File -FilePath $PidFile -Encoding ascii -NoNewline
Write-Info "Backend PID: $($proc.Id)  (log: $BackendLog)"

# ── wait for health ───────────────────────────────────────────────────────────
Wait-ForBackend

# ── summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Backend is running                                          ║" -ForegroundColor Green
Write-Host "║  API       ->  http://localhost:8080/api                     ║" -ForegroundColor Green
Write-Host "║  Health    ->  http://localhost:8080/actuator/health         ║" -ForegroundColor Green
if ($Profile -eq "dev") {
Write-Host "║  Swagger   ->  http://localhost:8080/swagger-ui.html         ║" -ForegroundColor Green
Write-Host "║  H2 DB     ->  http://localhost:8080/h2-console              ║" -ForegroundColor Green
}
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║  Stop:  .\kill.ps1                                           ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
