#!/bin/bash

# Siriux Production Runner
# Usage: ./prod.sh [clean|build|run]
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
    echo -e "${BLUE}[SIRIUX PROD]${NC} $1"
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
    
    # Kill existing backend processes (both dev and prod)
    BACKEND_PIDS=$(pgrep -f "node.*dist/index.js\|ts-node-dev.*src/index.ts" 2>/dev/null || true)
    if [ ! -z "$BACKEND_PIDS" ]; then
        print_status "Stopping existing backend instances..."
        echo $BACKEND_PIDS | xargs kill -9 2>/dev/null || true
        print_success "Backend instances stopped"
    fi
    
    # Kill existing frontend processes (both dev and prod)
    FRONTEND_PIDS=$(pgrep -f "next start\|next dev" 2>/dev/null || true)
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

print_status "Starting Siriux Production with command: $COMMAND"

# Clean function
clean() {
    print_status "Cleaning production build artifacts..."
    
    print_status "Cleaning backend..."
    cd backend
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "Backend dist cleaned"
    fi
    
    print_status "Cleaning frontend..."
    cd ../frontend
    if [ -d ".next" ]; then
        rm -rf .next
        print_success "Frontend .next cleaned"
    fi
    if [ -d "out" ]; then
        rm -rf out
        print_success "Frontend out cleaned"
    fi
    
    cd ..
    print_success "Production clean completed!"
}

# Build function
build() {
    print_status "Building for production..."
    
    print_status "Building backend..."
    cd backend
    npm install --production=false
    npm run build
    print_success "Backend built for production"
    
    print_status "Building frontend..."
    cd ../frontend
    npm install --production=false
    npm run build
    print_success "Frontend built for production"
    
    cd ..
    print_success "Production build completed!"
}

# Run function
run() {
    print_status "Starting production servers..."
    
    # Kill any existing instances first
    kill_existing_instances
    
    # Check if production builds exist
    if [ ! -d "backend/dist" ]; then
        print_error "Backend build not found. Run './prod.sh build' first."
        exit 1
    fi
    
    if [ ! -d "frontend/.next" ]; then
        print_error "Frontend build not found. Run './prod.sh build' first."
        exit 1
    fi
    
    # Check if .env files exist
    if [ ! -f "backend/.env" ]; then
        print_error "backend/.env not found!"
        print_status "Please create backend/.env with production values"
        exit 1
    fi
    
    if [ ! -f "frontend/.env.local" ]; then
        print_warning "frontend/.env.local not found (optional)"
    fi
    
    print_status "Installing production dependencies..."
    cd backend
    npm install --production
    cd ../frontend
    npm install --production
    cd ..
    print_success "Production dependencies installed"
    
    print_status "Starting backend production server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    print_status "Starting frontend production server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Production servers started!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend:  http://localhost:3002"
    print_status ""
    print_status "Press Ctrl+C to stop both servers"
    
    # Function to cleanup on exit
    cleanup() {
        print_status "Stopping production servers..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Production servers stopped"
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
        print_status "  clean - Remove production build artifacts"
        print_status "  build - Build both projects for production"
        print_status "  run   - Start production servers (default)"
        print_status "  kill  - Stop all running instances"
        exit 1
        ;;
esac
