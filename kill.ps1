# kill.ps1 - Stop the Banking Statement Converter backend (port 8080)
# Platforms: macOS, Ubuntu/Debian Linux, Windows 10+  (requires PowerShell Core 7+ on Mac/Linux)
# Usage:  .\kill.ps1   or   pwsh ./kill.ps1

param(
    [int[]]$Ports = @(8080)
)

# -- PS 5.x / Windows PowerShell compat shim ----------------------------------
if ($null -eq (Get-Variable 'IsWindows' -ErrorAction SilentlyContinue)) {
    $IsWindows = $true; $IsMacOS = $false; $IsLinux = $false
}

$ScriptDir = $PSScriptRoot
$LogDir    = Join-Path $ScriptDir "logs"
$PidFile   = Join-Path $LogDir "backend.pid"

function Write-Info { param($m) Write-Host "[INFO]  $m" -ForegroundColor Cyan }
function Write-Ok   { param($m) Write-Host "[OK]    $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[WARN]  $m" -ForegroundColor Yellow }

function Get-PortPIDs([int]$Port) {
    if ($IsWindows) {
        $lines = & netstat -ano 2>$null | Select-String ":$Port\s" |
                 Where-Object { $_ -match 'LISTENING' }
        return $lines | ForEach-Object {
            $parts = $_.Line.Trim() -split '\s+'
            if ($parts[-1] -match '^\d+$') { [int]$parts[-1] }
        } | Where-Object { $_ -gt 0 } | Select-Object -Unique
    } else {
        if (Get-Command lsof -ErrorAction SilentlyContinue) {
            $raw = & lsof -ti:$Port 2>/dev/null
            if ($raw) { return $raw | ForEach-Object { [int]$_.Trim() } | Where-Object { $_ -gt 0 } }
        }
        if (Get-Command ss -ErrorAction SilentlyContinue) {
            $raw = & ss -tlnp 2>/dev/null
            return $raw | Where-Object { $_ -match ":$Port[ $]" } |
                ForEach-Object {
                    if ($_ -match 'pid=(\d+)') { [int]$Matches[1] }
                } | Where-Object { $_ -gt 0 }
        }
        if (Get-Command fuser -ErrorAction SilentlyContinue) {
            $raw = & bash -c "fuser ${Port}/tcp 2>/dev/null" 2>/dev/null
            if ($raw) { return $raw.Trim() -split '\s+' | ForEach-Object { [int]$_ } | Where-Object { $_ -gt 0 } }
        }
        return @()
    }
}

function Stop-PID([int]$Pid, [string]$Label) {
    try {
        if ($IsWindows) {
            Stop-Process -Id $Pid -Force -ErrorAction Stop
        } else {
            & kill -9 $Pid 2>/dev/null
        }
        Write-Ok "Stopped $Label (PID $Pid)"
        return $true
    } catch {
        return $false
    }
}

Write-Host ""
Write-Info "Stopping Banking Statement Converter backend..."
Write-Host ""

$killed = 0

# -- 1. PID-file kill ---------------------------------------------------------
if (Test-Path $PidFile) {
    $savedPid = [int]((Get-Content $PidFile -Raw).Trim())
    $proc = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
    if ($proc) {
        if ($IsWindows) { Stop-Process -Id $savedPid -Force -ErrorAction SilentlyContinue }
        else { & kill -9 $savedPid 2>/dev/null }
        Write-Ok "Stopped backend from PID file (PID $savedPid)"
        $killed++
    } else {
        Write-Warn "PID $savedPid from file not running"
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

# -- 2. Pattern-based kill (safety net) ---------------------------------------
if ($IsWindows) {
    $procs = Get-Process -Name "java" -ErrorAction SilentlyContinue |
             Where-Object { $_.MainWindowTitle -match 'Banking' -or $true }
    if ($procs) {
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Ok "Stopped java.exe process(es)"
        $killed++
    }
} else {
    $result = & bash -c "pkill -f 'BankingConverterApplication' 2>/dev/null; echo \$?" 2>/dev/null
    if ($result -eq "0") { Write-Ok "Stopped BankingConverterApplication"; $killed++ }
    $result2 = & bash -c "pkill -f 'spring-boot:run' 2>/dev/null; echo \$?" 2>/dev/null
    if ($result2 -eq "0") { Write-Ok "Stopped spring-boot:run"; $killed++ }
}

# -- 3. Port-based kill (final safety net) ------------------------------------
foreach ($port in $Ports) {
    $pids = Get-PortPIDs $port
    if ($pids) {
        foreach ($p in $pids) {
            if (Stop-PID $p "process on port $port") { $killed++ }
        }
    }
}

Write-Host ""
if ($killed -gt 0) {
    Write-Ok "Done - $killed process group(s) stopped."
} else {
    Write-Warn "No matching processes found - nothing to kill."
}
Write-Host ""
