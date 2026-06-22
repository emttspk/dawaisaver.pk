# PowerShell validation script for Windows
param(
    [string]$CoolifyUrl = $env:COOLIFY_URL,
    [string]$CoolifyToken = $env:COOLIFY_TOKEN
)

if (Test-Path .env.coolify) {
    Get-Content .env.coolify | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            Set-ItemProperty -Path "env:" -Name $matches[1] -Value $matches[2]
        }
    }
}

if ([string]::IsNullOrEmpty($CoolifyUrl) -or [string]::IsNullOrEmpty($CoolifyToken)) {
    Write-Host "Error: COOLIFY_URL and COOLIFY_TOKEN must be set in .env.coolify"
    Write-Host "Run: copy .coolify\.env.example .coolify\.env.coolify"
    exit 1
}

Write-Host "=== Coolify Validation Checklist ==="
Write-Host ""

Write-Host "1. Checking API authentication..."
$headers = @{ "Authorization" = "Bearer $CoolifyToken" }
try {
    $response = Invoke-RestMethod -Uri "$CoolifyUrl/api/v1/teams/current" -Headers $headers -ErrorAction Stop
    Write-Host "   [PASS] Authentication successful"
} catch {
    Write-Host "   [FAIL] Authentication failed: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "2. Checking server reachability..."
$servers = Invoke-RestMethod -Uri "$CoolifyUrl/api/v1/servers" -Headers $headers
$servers | ForEach-Object {
    Write-Host "   $($_.name): reachable=$($_.settings.is_reachable), usable=$($_.settings.is_usable)"
}

Write-Host ""
Write-Host "3. Checking applications..."
$apps = Invoke-RestMethod -Uri "$CoolifyUrl/api/v1/applications" -Headers $headers
Write-Host "   Total applications: $($apps.Length)"

Write-Host ""
Write-Host "4. Application status:"
$apps | ForEach-Object {
    Write-Host "   $($_.name): $($_.status)"
}

Write-Host ""
Write-Host "Validation complete."