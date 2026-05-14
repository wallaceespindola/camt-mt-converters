@echo off
REM kill.bat — Stop the Banking Statement Converter backend (port 8080)
REM Platform: Windows 10+  (CMD)
REM Usage: kill.bat

setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "LOG_DIR=%SCRIPT_DIR%logs"
set /a killed=0

echo.
echo [INFO]  Stopping Banking Statement Converter backend...
echo.

REM ── 1. Kill by port 8080 (Spring Boot backend) ────────────────────────────────
echo [INFO]  Checking port 8080...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    if "%%p" neq "" (
        if "%%p" neq "0" (
            echo [INFO]  Killing PID %%p on port 8080...
            taskkill /PID %%p /F >nul 2>&1
            if !errorlevel! equ 0 (
                echo [OK]    Stopped process on port 8080 ^(PID %%p^)
                set /a killed+=1
            ) else (
                echo [WARN]  Could not stop PID %%p - may already be stopped
            )
        )
    )
)

REM ── 2. Kill java.exe processes (Spring Boot) ──────────────────────────────────
echo [INFO]  Checking for java.exe ^(Spring Boot^) processes...
tasklist /fi "imagename eq java.exe" /fi "windowtitle eq BankingConverter-Backend" /nh 2>nul | findstr /i "java.exe" >nul
if %errorlevel% equ 0 (
    taskkill /fi "windowtitle eq BankingConverter-Backend" /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK]    Stopped BankingConverter-Backend window
        set /a killed+=1
    )
)

REM Fallback: kill all java.exe if still on port 8080
netstat -ano 2>nul | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO]  Port 8080 still in use - attempting taskkill on java.exe...
    taskkill /IM java.exe /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK]    Stopped java.exe
        set /a killed+=1
    )
)

REM ── 3. Remove pid file if exists ──────────────────────────────────────────────
if exist "%LOG_DIR%\backend.pid" (
    del /f /q "%LOG_DIR%\backend.pid" >nul 2>&1
)

echo.
if %killed% gtr 0 (
    echo [OK]    Done - %killed% process group^(s^) stopped.
) else (
    echo [WARN]  No matching processes found - nothing to kill.
)
echo.

endlocal
