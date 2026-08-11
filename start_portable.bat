@echo off
echo Building the production version...
call npx vite build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo Starting Cold Mirror (Production Build)...
call npx electron .
