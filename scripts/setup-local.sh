#!/bin/bash

# Service Mesh Dashboard - Local Development Setup Script

set -e

echo "🚀 Starting Service Mesh Dashboard Setup..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required but not installed. Aborting."; exit 1; }

echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Setup environment files
echo -e "${BLUE}Setting up environment files...${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
fi

if [ ! -f dummy-service/.env ]; then
    cp dummy-service/.env.example dummy-service/.env
    echo -e "${GREEN}✓ Created dummy-service/.env${NC}"
fi

# Start PostgreSQL
echo -e "${BLUE}Starting PostgreSQL...${NC}"
docker run -d \
  --name mesh-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=meshdb \
  -p 5432:5432 \
  postgres:15 || echo "PostgreSQL container already exists"

echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Run Prisma migrations
echo -e "${BLUE}Running database migrations...${NC}"
cd backend
npm run prisma:migrate
npm run prisma:generate
cd ..

echo -e "${GREEN}✓ Database setup complete${NC}"

# Build Docker images
echo -e "${BLUE}Building Docker images...${NC}"
docker build -t mesh-backend:latest ./backend
docker build -t mesh-frontend:latest ./frontend
docker build --build-arg VERSION=v1 -t dummy-service:v1 ./dummy-service
docker build --build-arg VERSION=v2 -t dummy-service:v2 ./dummy-service

echo -e "${GREEN}✓ Docker images built${NC}"

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "To start the development servers:"
echo "  Terminal 1: npm run dev:backend"
echo "  Terminal 2: npm run dev:frontend"
echo "  Terminal 3: npm run dev:dummy"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up"
echo ""
echo "Access points:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo "  Dummy:    http://localhost:5000"
