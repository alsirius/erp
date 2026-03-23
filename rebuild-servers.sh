#!/bin/bash

# Siriux Development Server Rebuild Script
# Based on ticket-mix rebuild-servers.sh pattern

# Colors for output (matching ticket-mix style)
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Default environment and target
ENV="dev"
TARGET="both"  # Can be "frontend", "backend", or "both"

# Function to show help
show_help() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "Usage:
  ./rebuild-servers.sh [mode] [environment] [target] [options]

Modes:
  1, restart   - Just restart development servers
  2, rebuild   - Rebuild and restart servers
  3, clean     - Full clean, rebuild, and restart
  -h, --help   - Show this help message

Environment:
  dev         - Use development environment (.env.development) [default]
  prod        - Use production environment (.env.production)

Target:
  -f, --frontend  - Only process frontend
  -b, --backend   - Only process backend
  (none)          - Process both frontend and backend [default]

Options:
  -s, --seed    - Seed database with sample users (admin, manager, user)
  -v, --verbose  - Show verbose output"
}

# Function to check if environment files exist
check_env_files() {
    ENV_SUFFIX="development"
    if [ "$ENV" = "prod" ]; then
        ENV_SUFFIX="production"
    fi

    # Check backend environment file
    if [ ! -f "$BACKEND_DIR/.env.${ENV_SUFFIX}" ]; then
        echo -e "${RED}Error: Backend .env.${ENV_SUFFIX} file not found!${NC}"
        echo -e "Please create the file at: $BACKEND_DIR/.env.${ENV_SUFFIX}"
        return 1
    fi

    # Check frontend environment file
    if [ ! -f "$FRONTEND_DIR/.env.${ENV_SUFFIX}" ]; then
        echo -e "${RED}Error: Frontend .env.${ENV_SUFFIX} file not found!${NC}"
        echo -e "Please create the file at: $FRONTEND_DIR/.env.${ENV_SUFFIX}"
        return 1
    fi

    return 0
}

# Function to kill existing processes
kill_processes() {
    echo -e "${BLUE}Killing existing development processes...${NC}"
    
    # Kill by process name
    pkill -f "ts-node-dev" 2>/dev/null || true
    pkill -f "next" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "ts-node-dev" 2>/dev/null || true
    pkill -9 -f "next" 2>/dev/null || true
    pkill -9 -f "npm run dev" 2>/dev/null || true
    
    # Clear ports
    local pids=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
    
    local pids=$(lsof -ti:3002 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
    
    sleep 1
    echo -e "${GREEN}All processes stopped${NC}"
}

# Function to clean node_modules
clean_node_modules() {
    local target=$1
    
    echo -e "${BLUE}Cleaning node_modules for target: $target...${NC}"
    
    if [[ "$target" == "both" || "$target" == "backend" ]]; then
        echo -e "${BLUE}Cleaning backend node_modules...${NC}"
        cd "$BACKEND_DIR"
        rm -rf node_modules package-lock.json
        echo -e "${GREEN}Backend node_modules cleaned${NC}"
    fi
    
    if [[ "$target" == "both" || "$target" == "frontend" ]]; then
        echo -e "${BLUE}Cleaning frontend node_modules...${NC}"
        cd "$FRONTEND_DIR"
        rm -rf node_modules package-lock.json .next
        echo -e "${GREEN}Frontend node_modules cleaned${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    local target=$1
    
    echo -e "${BLUE}Installing dependencies for target: $target...${NC}"
    
    if [[ "$target" == "both" || "$target" == "backend" ]]; then
        echo -e "${BLUE}Installing backend dependencies...${NC}"
        cd "$BACKEND_DIR"
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Backend dependencies installed${NC}"
        else
            echo -e "${RED}Backend dependency installation failed${NC}"
            return 1
        fi
    fi
    
    if [[ "$target" == "both" || "$target" == "frontend" ]]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        cd "$FRONTEND_DIR"
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Frontend dependencies installed${NC}"
        else
            echo -e "${RED}Frontend dependency installation failed${NC}"
            return 1
        fi
    fi
}

# Function to build projects
build_projects() {
    local target=$1
    
    echo -e "${BLUE}Building projects for target: $target...${NC}"
    
    if [[ "$target" == "both" || "$target" == "backend" ]]; then
        echo -e "${BLUE}Building backend...${NC}"
        cd "$BACKEND_DIR"
        npm run build
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Backend build successful${NC}"
        else
            echo -e "${RED}Backend build failed${NC}"
            return 1
        fi
    fi
    
    if [[ "$target" == "both" || "$target" == "frontend" ]]; then
        echo -e "${BLUE}Building frontend...${NC}"
        cd "$FRONTEND_DIR"
        npm run build
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Frontend build successful${NC}"
        else
            echo -e "${RED}Frontend build failed${NC}"
            return 1
        fi
    fi
}

# Function to start development servers
start_dev_servers() {
    local target=$1
    
    echo -e "${BLUE}Starting development servers for target: $target...${NC}"
    
    # Set environment variables
    local ENV_SUFFIX="development"
    if [ "$ENV" = "prod" ]; then
        ENV_SUFFIX="production"
        export NODE_ENV=production
    else
        export NODE_ENV=development
    fi
    
    if [[ "$target" == "both" || "$target" == "backend" ]]; then
        echo -e "${BLUE}Starting backend development server...${NC}"
        cd "$BACKEND_DIR"
        
        # Load environment variables from the correct file
        if [ -f ".env.${ENV_SUFFIX}" ]; then
            echo -e "${BLUE}Loading environment from .env.${ENV_SUFFIX}${NC}"
            export $(grep -v '^#' ".env.${ENV_SUFFIX}" | xargs)
        fi
        
        # Start backend with environment
        NODE_ENV=$ENV npx ts-node-dev --respawn --clear --ignore-watch node_modules src/index.ts > /tmp/siriux-backend.log 2>&1 &
        BACKEND_PID=$!
        echo -e "${GREEN}Backend server started (PID: $BACKEND_PID)${NC}"
        echo -e "${BLUE}Environment: $ENV${NC}"
        
        # Wait and test backend
        sleep 3
        if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}Backend health check passed${NC}"
        else
            echo -e "${YELLOW}Backend health check failed - check logs with: tail -f /tmp/siriux-backend.log${NC}"
        fi
    fi
    
    if [[ "$target" == "both" || "$target" == "frontend" ]]; then
        echo -e "${BLUE}Starting frontend development server...${NC}"
        cd "$FRONTEND_DIR"
        
        # Load environment variables for frontend
        if [ -f ".env.${ENV_SUFFIX}" ]; then
            echo -e "${BLUE}Loading frontend environment from .env.${ENV_SUFFIX}${NC}"
            export $(grep -v '^#' ".env.${ENV_SUFFIX}" | xargs)
        fi
        
        # Start frontend with environment
        NODE_ENV=$ENV npm run dev > /tmp/siriux-frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo -e "${GREEN}Frontend server started (PID: $FRONTEND_PID)${NC}"
        echo -e "${BLUE}Environment: $ENV${NC}"
        
        # Wait and test frontend
        sleep 5
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}Frontend health check passed${NC}"
        else
            echo -e "${YELLOW}Frontend health check failed - check logs with: tail -f /tmp/siriux-frontend.log${NC}"
        fi
    fi
}

# Function to show final status
show_status() {
    echo
    echo -e "${BLUE}=== Siriux Development Server Status ===${NC}"
    
    if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
        echo -e "Backend: ${GREEN}RUNNING${NC} - http://localhost:3002"
    else
        echo -e "Backend: ${RED}STOPPED${NC}"
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "Frontend: ${GREEN}RUNNING${NC} - http://localhost:3000"
    else
        echo -e "Frontend: ${RED}STOPPED${NC}"
    fi
    
    echo -e "${BLUE}=======================================${NC}"
    echo
    echo -e "${GREEN}Siriux development servers are ready!${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend:  http://localhost:3002"
    echo "API Health: http://localhost:3002/api/health"
    echo
    echo -e "${BLUE}Logs:${NC}"
    echo "  Backend:  tail -f /tmp/siriux-backend.log"
    echo "  Frontend: tail -f /tmp/siriux-frontend.log"
    echo "  Both:     tail -f /tmp/siriux-backend.log /tmp/siriux-frontend.log"
    echo
}

# Main script logic
MODE="restart"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        1|restart)
            MODE="restart"
            shift
            ;;
        2|rebuild)
            MODE="rebuild"
            shift
            ;;
        3|clean)
            MODE="clean"
            shift
            ;;
        dev|development)
            ENV="dev"
            shift
            ;;
        prod|production)
            ENV="prod"
            shift
            ;;
        -f|--frontend)
            TARGET="frontend"
            shift
            ;;
        -b|--backend)
            TARGET="backend"
            shift
            ;;
        -s|--seed)
            SEED_DATABASE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check environment files
if ! check_env_files; then
    exit 1
fi

# Execute based on mode
case $MODE in
    "restart")
        echo -e "${BLUE}Mode: Restart development servers${NC}"
        echo -e "${BLUE}Environment: $ENV${NC}"
        echo -e "${BLUE}Target: $TARGET${NC}"
        echo
        
        kill_processes
        start_dev_servers $TARGET
        show_status
        ;;
        
    "rebuild")
        echo -e "${BLUE}Mode: Rebuild and restart servers${NC}"
        echo -e "${BLUE}Environment: $ENV${NC}"
        echo -e "${BLUE}Target: $TARGET${NC}"
        echo
        
        kill_processes
        install_dependencies $TARGET
        start_dev_servers $TARGET
        
        # Seed database if requested
        if [ "$SEED_DATABASE" = "true" ]; then
            echo -e "${BLUE}Seeding database with sample users...${NC}"
            cd "$BACKEND_DIR"
            npm run seed
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}Database seeded successfully!${NC}"
            else
                echo -e "${RED}Database seeding failed!${NC}"
            fi
        fi
        
        show_status
        ;;
        
    "clean")
        echo -e "${BLUE}Mode: Full clean, rebuild, and restart${NC}"
        echo -e "${BLUE}Environment: $ENV${NC}"
        echo -e "${BLUE}Target: $TARGET${NC}"
        echo
        
        kill_processes
        clean_node_modules $TARGET
        install_dependencies $TARGET
        build_projects $TARGET
        start_dev_servers $TARGET
        show_status
        ;;
esac
