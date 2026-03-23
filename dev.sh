#!/bin/bash

# Siriux Development Runner
# Usage: ./dev.sh [clean|build|run]
# Default: run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[SIRIUX]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill existing instances
kill_existing_instances() {
    print_status "Checking for existing instances..."
    
    # Kill existing backend processes
    BACKEND_PIDS=$(pgrep -f "ts-node-dev.*src/index.ts" 2>/dev/null || true)
    if [ ! -z "$BACKEND_PIDS" ]; then
        print_status "Stopping existing backend instances..."
        echo $BACKEND_PIDS | xargs kill -9 2>/dev/null || true
        print_success "Backend instances stopped"
    fi
    
    # Kill existing frontend processes
    FRONTEND_PIDS=$(pgrep -f "next dev" 2>/dev/null || true)
    if [ ! -z "$FRONTEND_PIDS" ]; then
        print_status "Stopping existing frontend instances..."
        echo $FRONTEND_PIDS | xargs kill -9 2>/dev/null || true
        print_success "Frontend instances stopped"
    fi
    
    # Also kill any processes on the specific ports
    PORT_3002_PID=$(lsof -ti:3002 2>/dev/null || true)
    if [ ! -z "$PORT_3002_PID" ]; then
        print_status "Stopping process on port 3002..."
        kill -9 $PORT_3002_PID 2>/dev/null || true
        print_success "Process on port 3002 stopped"
    fi
    
    PORT_3000_PID=$(lsof -ti:3000 2>/dev/null || true)
    if [ ! -z "$PORT_3000_PID" ]; then
        print_status "Stopping process on port 3000..."
        kill -9 $PORT_3000_PID 2>/dev/null || true
        print_success "Process on port 3000 stopped"
    fi
    
    # Wait a moment for processes to fully terminate
    sleep 2
    print_success "All existing instances stopped"
}

# Get the command (default: run)
COMMAND=${1:-run}

print_status "Starting Siriux with command: $COMMAND"

# Clean function
clean() {
    print_status "Cleaning build artifacts and dependencies..."
    
    print_status "Cleaning backend..."
    cd backend
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "Backend dist cleaned"
    fi
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_success "Backend node_modules cleaned"
    fi
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
        print_success "Backend package-lock.json cleaned"
    fi
    
    print_status "Cleaning frontend..."
    cd ../frontend
    if [ -d ".next" ]; then
        rm -rf .next
        print_success "Frontend .next cleaned"
    fi
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_success "Frontend node_modules cleaned"
    fi
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
        print_success "Frontend package-lock.json cleaned"
    fi
    
    cd ..
    print_success "Clean completed!"
}

# Build function
build() {
    print_status "Building backend and frontend..."
    
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    print_success "Backend dependencies installed"
    
    print_status "Building backend..."
    npm run build
    print_success "Backend built successfully"
    
    print_status "Installing frontend dependencies..."
    cd ../frontend
    npm install
    print_success "Frontend dependencies installed"
    
    print_status "Building frontend..."
    npm run build
    print_success "Frontend built successfully"
    
    cd ..
    print_success "Build completed!"
}

# Run function
run() {
    print_status "Starting development servers..."
    
    # Kill any existing instances first
    kill_existing_instances
    
    # Check if .env files exist
    if [ ! -f "backend/.env.development" ]; then
        print_error "backend/.env.development not found!"
        print_status "Please create backend/.env.development with:"
        echo "PORT=3002"
        echo "NODE_ENV=development"
        echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production"
        echo "DB_PATH=./database/siriux.db"
        echo "FRONTEND_URL=http://localhost:3000"
        exit 1
    fi
    
    if [ ! -f "frontend/.env.development" ]; then
        print_error "frontend/.env.development not found!"
        print_status "Please create frontend/.env.development with:"
        echo "NEXT_PUBLIC_API_URL=http://localhost:3002"
        echo "NEXT_PUBLIC_APP_NAME=Siriux"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "backend/node_modules" ]; then
        print_status "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    print_status "Starting frontend server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Both servers started!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend:  http://localhost:3002"
    print_status "API Health: http://localhost:3002/api/health"
    print_status ""
    print_status "Press Ctrl+C to stop both servers"
    
    # Function to cleanup on exit
    cleanup() {
        print_status "Stopping servers..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Servers stopped"
        exit 0
    }
    
    # Set trap for cleanup
    trap cleanup SIGINT SIGTERM
    
    # Wait for processes
    wait
}

# Main execution
case $COMMAND in
    clean)
        clean
        ;;
    build)
        build
        ;;
    run)
        run
        ;;
    kill)
        kill_existing_instances
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        print_status "Usage: $0 [clean|build|run|kill]"
        print_status "  clean - Remove all build artifacts and dependencies"
        print_status "  build - Install dependencies and build both projects"
        print_status "  run   - Start development servers (default)"
        print_status "  kill  - Stop all running instances"
        exit 1
        ;;
esac
