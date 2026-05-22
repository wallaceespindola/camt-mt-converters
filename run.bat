@echo off
REM run.bat — Build and start the Banking Statement Converter backend (port 8080)
REM Platform: Windows 10+  (CMD)
REM Usage:
REM   run.bat              — build and start (Swagger at /swagger-ui.html, H2 at /h2-console)
REM   run.bat --skip-build — skip Maven build

setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "LOG_DIR=%SCRIPT_DIR%logs"
set "BACKEND_LOG=%LOG_DIR%\backend.log"
set "BUILD_LOG=%LOG_DIR%\build.log"
set "BACKEND_PORT=8080"
set "HEALTH_URL=http://localhost:%BACKEND_PORT%/actuator/health"
set "WAIT_SECS=90"
set "SKIP_BUILD=false"

REM ── parse args ────────────────────────────────────────────────────────────────
for %%a in (%*) do (
    if "%%a"=="--skip-build"  set "SKIP_BUILD=true"
)

echo.
echo ============================================================
echo   Banking Statement Converter - Backend Launcher
echo   Platform : Windows
echo ============================================================
echo.

REM ── create log directory ──────────────────────────────────────────────────────
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM ── pre-flight: check required tools ──────────────────────────────────────────
where java >nul 2>&1 || (echo [ERROR] java not found in PATH & exit /b 1)
where mvn  >nul 2>&1 || (echo [ERROR] mvn not found in PATH  & exit /b 1)

REM ── check port availability ───────────────────────────────────────────────────
netstat -ano 2>nul | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN]  Port %BACKEND_PORT% already in use - run kill.bat first.
    exit /b 1
)

REM ── 1. Maven build ────────────────────────────────────────────────────────────
if "%SKIP_BUILD%"=="false" (
    echo [INFO]  Building project ^(skipping tests^)...
    cd /d "%SCRIPT_DIR%"
    call mvn clean package -DskipTests > "%BUILD_LOG%" 2>&1
    findstr /c:"BUILD SUCCESS" "%BUILD_LOG%" >nul
    if %errorlevel% neq 0 (
        echo [ERROR] Maven build failed - see %BUILD_LOG%
        exit /b 1
    )
    echo [OK]    Build complete
) else (
    echo [INFO]  Skipping build ^(--skip-build^)
)

REM ── 2. Start backend in a new window ─────────────────────────────────────────
echo [INFO]  Starting Spring Boot backend ^(port: %BACKEND_PORT%^)...
cd /d "%SCRIPT_DIR%"
start "BankingConverter-Backend" cmd /c "mvn spring-boot:run > ^"%BACKEND_LOG%^" 2>&1"
echo [INFO]  Backend starting in a new window... ^(log: %BACKEND_LOG%^)

REM ── wait for health ───────────────────────────────────────────────────────────
echo [INFO]  Waiting for backend on port %BACKEND_PORT% ^(up to %WAIT_SECS%s^)...
set /a waited=0

:wait_loop
    if %waited% geq %WAIT_SECS% (
        echo [ERROR] Backend did not start within %WAIT_SECS%s - check %BACKEND_LOG%
        exit /b 1
    )
    curl -sf "%HEALTH_URL%" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK]    Backend is up after %waited%s
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
    set /a waited+=1
goto :wait_loop

:backend_ready

REM ── summary ───────────────────────────────────────────────────────────────────
echo.
echo ============================================================
echo   Backend is running
echo   UI        -^>  http://localhost:8080/
echo   API       -^>  http://localhost:8080/api
echo   Swagger   -^>  http://localhost:8080/swagger-ui.html
echo   H2 DB     -^>  http://localhost:8080/h2-console
echo   Health    -^>  http://localhost:8080/actuator/health
echo.
echo   Stop:  kill.bat
echo ============================================================
echo.

endlocal
