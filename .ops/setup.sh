#!/bin/bash

# =============================================================================
# User Service Environment Setup Script
# =============================================================================
# This script sets up the user service for any environment by reading from 
# environment-specific .env files and configuring Docker Compose accordingly.

set -e

SERVICE_NAME="user-service"
SERVICE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --skip-deps              Skip dependency installation"
    echo "  --skip-db                Skip database setup"
    echo "  --build                  Force rebuild Docker images"
    echo "  --logs                   Show logs after startup"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                       # Standard setup"
    echo "  $0 --build --logs        # Rebuild and show logs"
}

# Parse command line arguments
SKIP_DEPS=false
SKIP_DB=false
FORCE_BUILD=false
SHOW_LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        log_success "Node.js $NODE_VERSION is installed"
        
        if [[ $(echo "$NODE_VERSION" | cut -d. -f1) -lt 18 ]]; then
            log_warning "Node.js version 18+ is recommended. Current: $NODE_VERSION"
        fi
    else
        log_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm $NPM_VERSION is installed"
    else
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
        log_success "Docker $DOCKER_VERSION is installed"
        
        # Check if Docker is running
        if docker info >/dev/null 2>&1; then
            log_success "Docker daemon is running"
        else
            log_error "Docker daemon is not running. Please start Docker."
            exit 1
        fi
    else
        log_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    # Check Docker Compose
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        if command_exists docker-compose; then
            COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
            log_success "Docker Compose $COMPOSE_VERSION is installed"
        else
            COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "v2.x")
            log_success "Docker Compose $COMPOSE_VERSION is installed (as Docker plugin)"
        fi
    else
        log_error "Docker Compose is not installed"
        exit 1
    fi
}

# Load and validate environment file
load_environment() {
    local env_file="$SERVICE_PATH/.env.$ENVIRONMENT"
    local template_file="$SERVICE_PATH/.env.$ENVIRONMENT.template"
    
    log_info "Loading environment configuration for $ENVIRONMENT..."
    
    # Check if environment file exists
    if [[ ! -f "$env_file" ]]; then
        if [[ -f "$template_file" ]]; then
            log_warning "Environment file not found: $(basename $env_file)"
            log_info "Creating from template: $(basename $template_file)"
            cp "$template_file" "$env_file"
            log_warning "Please review and update $env_file with your actual values"
            log_info "Press any key to continue after updating the file..."
            read -r
        else
            log_error "Neither environment file nor template found"
            log_info "Expected files:"
            log_info "  - $env_file"
            log_info "  - $template_file"
            exit 1
        fi
    fi
    
    # Export environment variables
    set -a
    source "$env_file"
    set +a
    
    log_success "Environment loaded: $(basename $env_file)"
    log_info "NODE_ENV: ${NODE_ENV:-$ENVIRONMENT}"
    log_info "PORT: ${PORT:-3002}"
    log_info "Database: ${MONGODB_DB_NAME:-user_service_dev}"
}

# Install dependencies
install_dependencies() {
    if [[ "$SKIP_DEPS" == "true" ]]; then
        log_info "Skipping dependency installation"
        return
    fi
    
    log_info "Installing Node.js dependencies..."
    
    cd "$SERVICE_PATH"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        npm ci --omit=dev
    else
        npm install
    fi
    
    log_success "Dependencies installed successfully"
}

# Setup database (create seed data scripts if needed)
setup_database() {
    if [[ "$SKIP_DB" == "true" ]]; then
        log_info "Skipping database setup"
        return
    fi
    
    log_info "Preparing database setup..."
    
    # Create database scripts directory if not exists
    mkdir -p "$SERVICE_PATH/database/scripts"
    
    # Create a simple MongoDB init script if it doesn't exist
    if [[ ! -f "$SERVICE_PATH/database/scripts/init-mongo.js" ]]; then
        cat > "$SERVICE_PATH/database/scripts/init-mongo.js" << 'EOF'
// MongoDB initialization script for user-service
print('Starting MongoDB initialization for user-service...');

// Switch to the user service database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'user_service_dev');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

// Insert sample data for development
if (db.users.countDocuments() === 0) {
    print('Creating sample users...');
    db.users.insertMany([
        {
            username: "admin",
            email: "admin@aioutlet.com",
            role: "admin",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            username: "testuser",
            email: "test@aioutlet.com",
            role: "user",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
    print('Sample users created successfully');
} else {
    print('Users collection already has data, skipping seed');
}

print('MongoDB initialization completed successfully');
EOF
        log_success "Created MongoDB initialization script"
    fi
    
    log_success "Database setup prepared"
}

# Get appropriate docker-compose command
get_compose_command() {
    if command_exists docker-compose; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Build and start services
start_services() {
    log_info "Starting services with Docker Compose for $ENVIRONMENT environment..."
    
    cd "$SERVICE_PATH"
    
    local compose_cmd=$(get_compose_command)
    local compose_files="-f docker-compose.yml"
    
    # Add environment-specific override file
    case $ENVIRONMENT in
        development)
            # docker-compose.override.yml is loaded automatically
            ;;
        staging)
            compose_files="$compose_files -f docker-compose.staging.yml"
            ;;
        production)
            compose_files="$compose_files -f docker-compose.production.yml"
            ;;
    esac
    
    # Create shared network if it doesn't exist
    docker network create aioutlet-network 2>/dev/null || log_info "Network aioutlet-network already exists"
    
    # Build images if requested or if they don't exist
    if [[ "$FORCE_BUILD" == "true" ]]; then
        log_info "Building Docker images..."
        $compose_cmd $compose_files build --no-cache
    fi
    
    # Start services
    log_info "Starting services..."
    export NODE_ENV=$ENVIRONMENT
    $compose_cmd $compose_files up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if $compose_cmd $compose_files ps | grep -q "healthy"; then
            log_success "Services are healthy and ready!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_warning "Services may still be starting up (timeout reached)"
            break
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    echo
    
    # Show service status
    log_info "Service Status:"
    $compose_cmd $compose_files ps
}

# Display service information
show_service_info() {
    local port=${PORT:-3002}
    local host=${HOST:-localhost}
    
    if [[ "$host" == "0.0.0.0" ]]; then
        host="localhost"
    fi
    
    echo
    log_header "🎉 User Service Setup Complete!"
    echo "======================================="
    log_success "Environment: $ENVIRONMENT"
    log_success "Service URL: http://$host:$port"
    log_success "Health Check: http://$host:$port/health"
    log_success "API Base URL: http://$host:$port/api/users"
    echo
    log_info "💡 Useful Commands:"
    echo "   • View status:    $(get_compose_command) ps"
    echo "   • View logs:      $(get_compose_command) logs -f"
    echo "   • Stop services:  $(get_compose_command) down"
    echo "   • Restart:        ./.ops/setup.sh --env=$ENVIRONMENT"
    echo
    
    if [[ "$SHOW_LOGS" == "true" ]]; then
        log_info "📋 Showing recent logs..."
        $(get_compose_command) logs --tail=50
    fi
}

# Cleanup function for errors
cleanup_on_error() {
    log_error "Setup failed! Cleaning up..."
    cd "$SERVICE_PATH"
    $(get_compose_command) down 2>/dev/null || true
}

# Main execution function
main() {
    # Set up error handling
    trap cleanup_on_error ERR
    
    log_header "============================================"
    log_header "👥 User Service Environment Setup"
    log_header "============================================"
    
    local os=$(detect_os)
    log_info "Detected OS: $os"
    log_info "Target Environment: $ENVIRONMENT"
    log_info "Service Path: $SERVICE_PATH"
    echo
    
    # Execute setup steps
    check_prerequisites
    load_environment
    install_dependencies
    setup_database
    start_services
    show_service_info
    
    log_success "✅ Setup completed successfully!"
}

# Execute main function with all arguments
main "$@"
