#!/bin/bash

# Siriux Premium WebApp Starter Setup Script
# This script automates the setup of a new web application project

set -e  # Exit on any error

echo "🚀 Setting up Siriux Premium WebApp Starter..."
echo "=================================================="

# Function to print colored output
print_status() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
    exit 1
}

print_info() {
    echo "ℹ️  $1"
}

# Check if project name is provided
if [ -z "$1" ]; then
    print_error "Project name is required. Usage: ./setup.sh <project-name>"
fi

PROJECT_NAME="$1"
echo "📁 Creating project: $PROJECT_NAME"

# Create project directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME" || exit 1

# Clone the starter
echo "📥 Cloning Siriux Premium WebApp Starter..."
git clone https://github.com/alsirius/siriux.git .

# Remove git history to start fresh
echo "🔄 Removing git history..."
rm -rf .git

# Initialize new git repository
echo "🔧 Initializing new git repository..."
git init
git add .
git commit -m "🚀 Initial commit from Siriux Premium WebApp Starter"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Go back to root
cd ..

# Setup environment files
echo "⚙️  Setting up environment configuration..."

# Ask user which database they want to use
echo ""
echo "🗄️  Which database would you like to use?"
echo "1) PostgreSQL (Recommended for production)"
echo "2) SQLite (Good for development)"
read -p "Choose database (1-2): " db_choice

case $db_choice in
    1)
        cp .env.postgres.example .env
        print_status "PostgreSQL environment configured"
        print_info "Don't forget to update DATABASE_URL in .env with your PostgreSQL credentials"
        ;;
    2)
        cp .env.sqlite.example .env
        print_status "SQLite environment configured"
        ;;
    *)
        cp .env.postgres.example .env
        print_status "Default PostgreSQL environment configured"
        ;;
esac

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/data
mkdir -p frontend/public

# Setup frontend environment
echo "⚙️  Setting up frontend environment..."
cd frontend
cp ../.env .env.local
print_status "Frontend environment configured"

# Go back to root
cd ..

# Create initial database and run migrations
echo "🗄️  Setting up database..."
cd backend

if [ "$db_choice" = "2" ]; then
    # SQLite setup
    print_info "Running SQLite database setup..."
    npm run db:migrate
else
    # PostgreSQL setup - just inform user
    print_info "PostgreSQL database setup required:"
    print_info "1. Create database: createdb siriux_app"
    print_info "2. Update DATABASE_URL in .env with your credentials"
    print_info "3. Run: npm run db:migrate"
fi

cd ..

# Create development scripts
echo "🔧 Creating development scripts..."
cat > dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting development servers..."

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Backend running on http://localhost:3002 (PID: $BACKEND_PID)"
echo "✅ Frontend running on http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt signal
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

chmod +x dev.sh

# Create production build script
cat > build.sh << 'EOF'
#!/bin/bash
echo "🏗️  Building for production..."

# Build backend
echo "Building backend..."
cd backend
npm run build

# Build frontend
echo "Building frontend..."
cd ../frontend
npm run build

echo "✅ Build complete!"
echo "Backend build: backend/dist/"
echo "Frontend build: frontend/build/"
EOF

chmod +x build.sh

# Update package.json with project info
echo "📝 Updating package.json with project information..."
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.name = '$PROJECT_NAME';
packageJson.description = 'Web application built with Siriux Premium WebApp Starter';
packageJson.repository = {
    type: 'git',
    url: 'https://github.com/your-username/$PROJECT_NAME.git'
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
"

# Create initial commit with setup changes
git add .
git commit -m "🔧 Configure project: $PROJECT_NAME"

print_status "Setup complete!"
echo ""
echo "🎯 Your web application is ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env with your configuration"
echo "2. Run './dev.sh' to start development servers"
echo "3. Open http://localhost:3000 to see your app"
echo "4. Check AI_CONTEXT.md for development guidance"
echo ""
echo "📚 Documentation:"
echo "- AI_CONTEXT.md - AI development context and patterns"
echo "- README.md - Project documentation"
echo "- ARCHITECTURE.md - Technical architecture"
echo ""
echo "🚀 Happy coding!"
