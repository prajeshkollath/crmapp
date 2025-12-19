#!/bin/bash

echo "========================================"
echo "  CRM Platform - Local Docker Setup"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ docker-compose is available"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers (if any)..."
docker-compose -f docker-compose.local.yml down

echo ""
echo "🏗️  Building and starting services..."
echo "   - PostgreSQL (port 5432)"
echo "   - Backend API (port 8001)"
echo "   - Frontend (port 3000)"
echo ""
echo "⏳ This may take 3-5 minutes on first run..."
echo ""

# Build and start
docker-compose -f docker-compose.local.yml up --build

# Note: The script will keep running and show logs
# Press Ctrl+C to stop all services
