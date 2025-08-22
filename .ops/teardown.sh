#!/bin/bash

# =============================================================================
# User Service Teardown Script
# =============================================================================
# This script stops and cleans up the user service and related resources

set -e

SERVICE_NAME="user-service"
SERVICE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="development"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

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

# Show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --env=ENVIRONMENT    Environment (development, staging, production)"
    echo "  --remove-volumes     Remove persistent volumes (WARNING: Data loss!)"
    echo "  --remove-images      Remove Docker images"
    echo "  --force              Force removal without confirmation"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                   # Stop development services"
    echo "  $0 --env=staging     # Stop staging services"
    echo "  $0 --remove-volumes  # Stop and remove data volumes"
}

# Parse arguments
REMOVE_VOLUMES=false
REMOVE_IMAGES=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        --remove-volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        --remove-images)
            REMOVE_IMAGES=true
            shift
            ;;
        --force)
            FORCE=true
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

# Get compose command
get_compose_command() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Get compose files for environment
get_compose_files() {
    local files="-f docker-compose.yml"
    
    case $ENVIRONMENT in
        development)
            # override file is loaded automatically
            ;;
        staging)
            files="$files -f docker-compose.staging.yml"
            ;;
        production)
            files="$files -f docker-compose.production.yml"
            ;;
    esac
    
    echo "$files"
}

# Confirm destructive actions
confirm_action() {
    local message="$1"
    
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    echo -e "${YELLOW}$message${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Stop services
stop_services() {
    log_info "Stopping $SERVICE_NAME services for $ENVIRONMENT environment..."
    
    cd "$SERVICE_PATH"
    
    local compose_cmd=$(get_compose_command)
    local compose_files=$(get_compose_files)
    
    # Show current status
    log_info "Current service status:"
    $compose_cmd $compose_files ps 2>/dev/null || log_info "No services currently running"
    
    # Stop services
    export NODE_ENV=$ENVIRONMENT
    $compose_cmd $compose_files down
    
    log_success "Services stopped"
}

# Remove volumes
remove_volumes() {
    if [[ "$REMOVE_VOLUMES" != "true" ]]; then
        return
    fi
    
    if confirm_action "⚠️  WARNING: This will delete ALL persistent data including database content!"; then
        log_info "Removing volumes..."
        
        cd "$SERVICE_PATH"
        local compose_cmd=$(get_compose_command)
        local compose_files=$(get_compose_files)
        
        export NODE_ENV=$ENVIRONMENT
        $compose_cmd $compose_files down -v
        
        log_success "Volumes removed"
    else
        log_info "Volume removal cancelled"
    fi
}

# Remove images
remove_images() {
    if [[ "$REMOVE_IMAGES" != "true" ]]; then
        return
    fi
    
    if confirm_action "Remove Docker images for $SERVICE_NAME?"; then
        log_info "Removing Docker images..."
        
        # Remove service images
        docker images --format "table {{.Repository}}:{{.Tag}}" | grep "$SERVICE_NAME" | while read -r image; do
            if [[ -n "$image" ]] && [[ "$image" != "REPOSITORY:TAG" ]]; then
                docker rmi "$image" 2>/dev/null || log_warning "Could not remove image: $image"
            fi
        done
        
        # Clean up dangling images
        docker image prune -f >/dev/null 2>&1 || true
        
        log_success "Docker images cleaned up"
    else
        log_info "Image removal cancelled"
    fi
}

# Show cleanup summary
show_summary() {
    echo
    log_header "🧹 Teardown Summary"
    echo "=========================="
    log_success "Environment: $ENVIRONMENT"
    log_success "Services: Stopped"
    
    if [[ "$REMOVE_VOLUMES" == "true" ]]; then
        log_warning "Volumes: Removed (Data deleted)"
    else
        log_info "Volumes: Preserved"
    fi
    
    if [[ "$REMOVE_IMAGES" == "true" ]]; then
        log_info "Images: Removed"
    else
        log_info "Images: Preserved"
    fi
    
    echo
    log_info "💡 To restart the service:"
    log_info "   ./.ops/setup.sh --env=$ENVIRONMENT"
    echo
}

# Main execution
main() {
    log_header "============================================"
    log_header "🧹 User Service Teardown"
    log_header "============================================"
    
    log_info "Environment: $ENVIRONMENT"
    log_info "Remove volumes: $REMOVE_VOLUMES"
    log_info "Remove images: $REMOVE_IMAGES"
    echo
    
    stop_services
    remove_volumes
    remove_images
    show_summary
    
    log_success "✅ Teardown completed successfully!"
}

# Execute main function
main "$@"
