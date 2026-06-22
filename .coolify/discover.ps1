# PowerShell discover script for Windows
param(
    [string]$OutputFile = ".coolify\inventory.json"
)

if (Test-Path .env.coolify) {
    Get-Content .env.coolify | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            Set-ItemProperty -Path "env:" -Name $matches[1] -Value $matches[2]
        }
    }
}

if ([string]::IsNullOrEmpty($env:COOLIFY_URL) -or [string]::IsNullOrEmpty($env:COOLIFY_TOKEN)) {
    Write-Host "Error: COOLIFY_URL and COOLIFY_TOKEN must be set in .env.coolify"
    Write-Host "Creating template .env.coolify..."
    Set-Content -Path ".env.coolify" -Value @(
        "# Coolify API Configuration",
        "COOLIFY_URL=https://your-coolify-instance.com",
        "COOLIFY_TOKEN=your_api_token_here"
    )
    exit 1
}

$headers = @{ "Authorization" = "Bearer $env:COOLIFY_TOKEN" }

Write-Host "=== Discovering Coolify Resources ==="
Write-Host ""

Write-Host "Fetching teams..."
$teams = Invoke-RestMethod -Uri "$env:COOLIFY_URL/api/v1/teams" -Headers $headers

Write-Host "Fetching servers..."
$servers = Invoke-RestMethod -Uri "$env:COOLIFY_URL/api/v1/servers" -Headers $headers

Write-Host "Fetching projects..."
$projects = Invoke-RestMethod -Uri "$env:COOLIFY_URL/api/v1/projects" -Headers $headers

Write-Host "Fetching applications..."
$applications = Invoke-RestMethod -Uri "$env:COOLIFY_URL/api/v1/applications" -Headers $headers

Write-Host "Fetching resources..."
$resources = Invoke-RestMethod -Uri "$env:COOLIFY_URL/api/v1/resources" -Headers $headers

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$inventory = @{
    generated_at = $timestamp
    coolify_url = $env:COOLIFY_URL
    teams = $teams
    servers = $servers
    projects = $projects
    applications = $applications
    resources = $resources
}

$inventory | ConvertTo-Json -Depth 10 | Set-Content -Path $OutputFile

Write-Host ""
Write-Host "Inventory saved to: $OutputFile"
Write-Host ""
Write-Host "=== Summary ==="
Write-Host "Teams: $($teams.Length)"
Write-Host "Servers: $($servers.Length)"
Write-Host "Projects: $($projects.Length)"
Write-Host "Applications: $($applications.Length)"
Write-Host "Resources: $($resources.Length)"