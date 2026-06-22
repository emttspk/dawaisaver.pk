@echo off
setlocal enabledelayedexpansion

if exist .env.coolify (
    for /f "tokens=*" %%i in (.env.coolify) do set "%%i"
)

if "%COOLIFY_URL%"=="" (
    echo Error: COOLIFY_URL must be set in .env.coolify
    exit /b 1
)
if "%COOLIFY_TOKEN%"=="" (
    echo Error: COOLIFY_TOKEN must be set in .env.coolify
    exit /b 1
)

if "%1"=="" (
    echo Usage: %0 ^<application_uuid^>
    exit /b 1
)

set WEB_UUID=%1
echo Restarting Web application: %WEB_UUID%

curl -s -X POST -H "Authorization: Bearer %COOLIFY_TOKEN%" -H "Content-Type: application/json" "%COOLIFY_URL%/api/v1/applications/%WEB_UUID%/restart"
echo.