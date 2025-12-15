# Service Mesh Dashboard - Local Development Setup Script (PowerShell)

Write-Host "🚀 Starting Service Mesh Dashboard Setup..." -ForegroundColor Cyan

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Blue

$commands = @('node', 'docker', 'kubectl')
foreach ($cmd in $commands) {
    if (!(Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $cmd is required but not installed. Aborting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Prerequisites check passed" -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Blue
npm install

# Setup environment files
Write-Host "`nSetting up environment files..." -ForegroundColor Blue

if (!(Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Created backend\.env" -ForegroundColor Green
}

if (!(Test-Path "frontend\.env.local")) {
    Copy-Item "frontend\.env.local.example" "frontend\.env.local"
    Write-Host "✓ Created frontend\.env.local" -ForegroundColor Green
}

if (!(Test-Path "dummy-service\.env")) {
    Copy-Item "dummy-service\.env.example" "dummy-service\.env"
    Write-Host "✓ Created dummy-service\.env" -ForegroundColor Green
}

# Start PostgreSQL
Write-Host "`nStarting PostgreSQL..." -ForegroundColor Blue
$postgresExists = docker ps -a --format "{{.Names}}" | Select-String -Pattern "mesh-postgres"

if (!$postgresExists) {
    docker run -d `
        --name mesh-postgres `
        -e POSTGRES_PASSWORD=postgres `
        -e POSTGRES_DB=meshdb `
        -p 5432:5432 `
        postgres:15
} else {
    Write-Host "PostgreSQL container already exists" -ForegroundColor Yellow
    docker start mesh-postgres 2>$null
}

Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run Prisma migrations
Write-Host "`nRunning database migrations..." -ForegroundColor Blue
Push-Location backend
npm run prisma:migrate
npm run prisma:generate
Pop-Location

Write-Host "✓ Database setup complete" -ForegroundColor Green

# Build Docker images
Write-Host "`nBuilding Docker images..." -ForegroundColor Blue
docker build -t mesh-backend:latest .\backend
docker build -t mesh-frontend:latest .\frontend
docker build --build-arg VERSION=v1 -t dummy-service:v1 .\dummy-service
docker build --build-arg VERSION=v2 -t dummy-service:v2 .\dummy-service

Write-Host "✓ Docker images built" -ForegroundColor Green

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the development servers:" -ForegroundColor Cyan
Write-Host "  Terminal 1: npm run dev:backend"
Write-Host "  Terminal 2: npm run dev:frontend"
Write-Host "  Terminal 3: npm run dev:dummy"
Write-Host "`nOr use Docker Compose:" -ForegroundColor Cyan
Write-Host "  docker-compose up"
Write-Host "`nAccess points:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000"
Write-Host "  Backend:  http://localhost:4000"
Write-Host "  Dummy:    http://localhost:5000"
