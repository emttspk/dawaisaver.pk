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

echo === UUID Inventory ===
echo.

echo === Applications ===
curl -s -H "Authorization: Bearer %COOLIFY_TOKEN%" "%COOLIFY_URL%/api/v1/applications"
echo.
echo.

echo === Projects ===
curl -s -H "Authorization: Bearer %COOLIFY_TOKEN%" "%COOLIFY_URL%/api/v1/projects"
echo.
echo.

echo === Servers ===
curl -s -H "Authorization: Bearer %COOLIFY_TOKEN%" "%COOLIFY_URL%/api/v1/servers"
echo.