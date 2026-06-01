@echo off
setlocal

cd /d "%~dp0"

set "PORT=4173"
set "URL=http://127.0.0.1:%PORT%/"
set "NODE_EXE=C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE_EXE%" (
  set "NODE_EXE=node"
)

if /i "%~1"=="--check" (
  echo URL: %URL%
  echo NODE_EXE: %NODE_EXE%
  exit /b 0
)

echo Rust ^& Logic Web UI
echo URL: %URL%
echo.
echo The browser will open automatically. Keep this window open while testing.
echo Press Ctrl+C in this window to stop the server.
echo.

start "" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 1; Start-Process '%URL%'"

"%NODE_EXE%" scripts\serve-web-ui.mjs %PORT%
