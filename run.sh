#!/usr/bin/env bash
# run.sh — Build and start the Banking Statement Converter backend (port 8080)
# Platforms: macOS, Ubuntu/Debian Linux
# Usage:
#   ./run.sh              — build and start (Swagger at /swagger-ui.html, H2 at /h2-console)
#   ./run.sh --skip-build — skip Maven build, start from existing classes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
BACKEND_ERR="$LOG_DIR/backend-err.log"
BUILD_LOG="$LOG_DIR/build.log"
PID_FILE="$LOG_DIR/backend.pid"
BACKEND_PORT=8080
HEALTH_URL="http://localhost:${BACKEND_PORT}/actuator/health"
WAIT_SECS=90
SKIP_BUILD=false

# ── parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
  esac
done

# ── colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ── OS detection ──────────────────────────────────────────────────────────────
OS="unknown"
case "$(uname -s)" in
  Darwin) OS="macOS" ;;
  Linux)  OS="Linux" ;;
esac

# ── port helpers ──────────────────────────────────────────────────────────────
port_in_use() {
  local port="$1"
  if command -v lsof &>/dev/null; then
    lsof -ti:"$port" >/dev/null 2>&1
  elif command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":${port} " || ss -tlnp 2>/dev/null | grep -q ":${port}$"
  else
    netstat -tlnp 2>/dev/null | grep -q ":${port} "
  fi
}

# ── banner ────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════════"
echo " Banking Statement Converter — Backend Launcher"
echo " Platform : $OS"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ── pre-flight ────────────────────────────────────────────────────────────────
for cmd in java mvn curl; do
  if ! command -v "$cmd" &>/dev/null; then
    error "Required command not found: $cmd"
    exit 1
  fi
done

if port_in_use "$BACKEND_PORT"; then
  warn "Port ${BACKEND_PORT} already in use — run ./kill.sh first."
  exit 1
fi

mkdir -p "$LOG_DIR"

# ── 1. Maven build ────────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  info "Building project (skipping tests)..."
  cd "$SCRIPT_DIR"
  mvn clean package -DskipTests 2>&1 | tee "$BUILD_LOG" | grep -E "(BUILD|ERROR|\[ERROR\])" || true
  if ! grep -q "BUILD SUCCESS" "$BUILD_LOG"; then
    error "Maven build failed — see $BUILD_LOG"
    exit 1
  fi
  success "Build complete"
else
  info "Skipping build (--skip-build)"
fi

# ── 2. Start backend ──────────────────────────────────────────────────────────
info "Starting Spring Boot backend (port: ${BACKEND_PORT})..."
cd "$SCRIPT_DIR"

nohup mvn spring-boot:run \
  >"$BACKEND_LOG" 2>"$BACKEND_ERR" &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_FILE"
info "Backend PID: $BACKEND_PID  (log: $BACKEND_LOG)"

# ── wait for health ───────────────────────────────────────────────────────────
info "Waiting for backend on port ${BACKEND_PORT} (up to ${WAIT_SECS}s)..."
for i in $(seq 1 "$WAIT_SECS"); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    success "Backend is up after ${i}s"
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    error "Backend process died — check $BACKEND_LOG and $BACKEND_ERR"
    exit 1
  fi
  if [ "$i" -eq "$WAIT_SECS" ]; then
    error "Backend did not start within ${WAIT_SECS}s — check $BACKEND_LOG"
    exit 1
  fi
  sleep 1
done

# ── summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Backend is running                                          ║"
echo "║  UI        →  http://localhost:8080/                         ║"
echo "║  API       →  http://localhost:8080/api                      ║"
echo "║  Swagger   →  http://localhost:8080/swagger-ui.html          ║"
echo "║  H2 DB     →  http://localhost:8080/h2-console               ║"
echo "║  Health    →  http://localhost:8080/actuator/health          ║"
echo "║                                                              ║"
echo "║  Stop:  ./kill.sh                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
