# FleetFlow Installation Script for Windows
# Run this in PowerShell: .\install.ps1

Write-Host "🚀 Installing FleetFlow..." -ForegroundColor Cyan

# Install root dependencies
Write-Host "`n📦 Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Root installation failed!" -ForegroundColor Red
    exit 1
}

# Install server dependencies
Write-Host "`n📦 Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Server installation failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Install client dependencies
Write-Host "`n📦 Installing client dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client installation failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "`n✅ Installation complete!" -ForegroundColor Green
Write-Host "`nTo start the application, run: npm run dev" -ForegroundColor Cyan

