#!/bin/bash

# Siriux Development Server Start Script
# Based on ticket-mix start.sh pattern

# Get the absolute path to the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Get npm path
NPM_PATH="$(which npm)"
if [ -z "$NPM_PATH" ]; then
    echo "Error: npm not found"
    exit 1
fi

# Colors for output (matching ticket-mix style)
GREEN=$(printf '\033[0;32m')
RED=$(printf '\033[0;31m')
BLUE=$(printf '\033[0;34m')
YELLOW=$(printf '\033[1;33m')
NC=$(printf '\033[0m') # No Color

# PIDs for tracking processes
BACKEND_PID=""
FRONTEND_PID=""

# Function to print colored output (matching ticket-mix style)
print_sirius() {
    echo -e "${BLUE}[SIRIUX]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if process is running
is_process_running() {
    local pid=$1
    if ps -p $pid > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill processes by name
kill_processes() {
    local process_name=$1
    print_sirius "Killing existing $process_name processes..."
    
    # Kill by process name
    pkill -f "$process_name" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "$process_name" 2>/dev/null || true
    
    print_success "All $process_name processes stopped"
}

# Function to find and kill processes using specific ports
kill_port_users() {
    local port=$1
    print_sirius "Checking for processes using port $port..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_sirius "Killing processes on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        print_success "Port $port cleared"
    else
        print_success "Port $port is already free"
    fi
}

# Function to start backend
start_backend() {
    print_sirius "Starting backend server..."
    
    cd "$BACKEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_sirius "Installing backend dependencies..."
        npm install
    fi
    
    # Start backend with specific arguments
    BACKEND_PID=$(npx ts-node-dev --respawn --clear --ignore-watch node_modules src/index.ts > /tmp/siriux-backend.log 2>&1 & echo $!)
    
    # Wait for backend to start
    sleep 5
    
    # Check if backend is running
    if is_process_running $BACKEND_PID; then
        print_success "Backend server started (PID: $BACKEND_PID)"
        print_sirius "Backend logs: tail -f /tmp/siriux-backend.log"
        
        # Test backend health
        sleep 2
        if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
            print_success "Backend health check passed"
        else
            print_warning "Backend health check failed - check logs"
        fi
    else
        print_error "Backend failed to start - check logs:"
        tail -20 /tmp/siriux-backend.log
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    print_sirius "Starting frontend server..."
    
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_sirius "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend with specific arguments
    FRONTEND_PID=$(npm run dev > /tmp/siriux-frontend.log 2>&1 & echo $!)
    
    # Wait for frontend to start
    sleep 8
    
    # Check if frontend is running
    if is_process_running $FRONTEND_PID; then
        print_success "Frontend server started (PID: $FRONTEND_PID)"
        print_sirius "Frontend logs: tail -f /tmp/siriux-frontend.log"
        
        # Test frontend health
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend health check passed"
        else
            print_warning "Frontend health check failed - check logs"
        fi
    else
        print_error "Frontend failed to start - check logs:"
        tail -20 /tmp/siriux-frontend.log
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Server Status:"
    echo "=================="
    
    if [ -n "$BACKEND_PID" ] && is_process_running $BACKEND_PID; then
        echo -e "Backend: ${GREEN}RUNNING${NC} (PID: $BACKEND_PID)"
        echo "  Health: http://localhost:3002/api/health"
        echo "  Logs: tail -f /tmp/siriux-backend.log"
    else
        echo -e "Backend: ${RED}STOPPED${NC}"
    fi
    
    if [ -n "$FRONTEND_PID" ] && is_process_running $FRONTEND_PID; then
        echo -e "Frontend: ${GREEN}RUNNING${NC} (PID: $FRONTEND_PID)"
        echo "  URL: http://localhost:3000"
        echo "  Logs: tail -f /tmp/siriux-frontend.log"
    else
        echo -e "Frontend: ${RED}STOPPED${NC}"
    fi
    
    echo "=================="
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down servers..."
    
    if [ -n "$BACKEND_PID" ] && is_process_running $BACKEND_PID; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_PID" ] && is_process_running $FRONTEND_PID; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes
    kill_processes "ts-node-dev"
    kill_processes "next"
    
    print_success "All servers stopped"
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main script logic
case "${1:-restart}" in
    "restart")
        print_status "Restarting Siriux development servers..."
        
        # Kill existing processes
        kill_processes "ts-node-dev"
        kill_processes "next"
        kill_port_users 3002
        kill_port_users 3000
        
        # Start servers
        start_backend
        start_frontend
        
        # Show final status
        echo
        show_status
        echo
        print_success "Siriux development servers are ready!"
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:3002"
        echo "API Health: http://localhost:3002/api/health"
        echo
        print_status "Press Ctrl+C to stop all servers"
        
        # Keep script running
        wait
        ;;
        
    "start")
        print_status "Starting Siriux development servers..."
        start_backend
        start_frontend
        show_status
        wait
        ;;
        
    "stop")
        print_status "Stopping Siriux development servers..."
        cleanup
        ;;
        
    "status")
        show_status
        ;;
        
    "logs-backend")
        if [ -f "/tmp/siriux-backend.log" ]; then
            tail -f /tmp/siriux-backend.log
        else
            print_error "Backend log file not found"
        fi
        ;;
        
    "logs-frontend")
        if [ -f "/tmp/siriux-frontend.log" ]; then
            tail -f /tmp/siriux-frontend.log
        else
            print_error "Frontend log file not found"
        fi
        ;;
        
    "logs")
        print_status "Following both backend and frontend logs..."
        tail -f /tmp/siriux-backend.log /tmp/siriux-frontend.log
        ;;
        
    "help"|"-h"|"--help")
        echo "Siriux Development Server Control Script"
        echo
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  restart     Restart all servers (default)"
        echo "  start       Start all servers"
        echo "  stop        Stop all servers"
        echo "  status      Show server status"
        echo "  logs        Follow all logs"
        echo "  logs-backend    Follow backend logs only"
        echo "  logs-frontend  Follow frontend logs only"
        echo "  help        Show this help message"
        echo
        echo "Examples:"
        echo "  $0 restart    # Restart all servers"
        echo "  $0 status     # Check status"
        echo "  $0 logs       # View logs"
        ;;
        
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
