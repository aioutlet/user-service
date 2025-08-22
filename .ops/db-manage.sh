#!/bin/bash

# =============================================================================
# User Service Database Management Script
# =============================================================================
# This script manages database operations for the user service

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
    echo "Usage: $0 OPERATION [options]"
    echo ""
    echo "Operations:"
    echo "  setup        Set up database and collections"
    echo "  seed         Seed database with sample data"
    echo "  reset        Drop and recreate database"
    echo "  backup       Create database backup"
    echo "  restore      Restore database from backup"
    echo "  status       Show database status"
    echo ""
    echo "Options:"
    echo "  --env=ENV    Environment (development, staging, production)"
    echo "  --force      Skip confirmations"
    echo "  -h, --help   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # Setup development database"
    echo "  $0 seed --env=development   # Seed development data"
    echo "  $0 reset --force            # Reset without confirmation"
}

# Parse arguments
OPERATION=""
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        setup|seed|reset|backup|restore|status)
            OPERATION="$1"
            shift
            ;;
        --env=*)
            ENVIRONMENT="${1#*=}"
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
            if [[ -z "$OPERATION" ]]; then
                OPERATION="$1"
                shift
            else
                log_error "Unknown option: $1"
                show_usage
                exit 1
            fi
            ;;
    esac
done

if [[ -z "$OPERATION" ]]; then
    log_error "Operation is required"
    show_usage
    exit 1
fi

# Load environment
load_environment() {
    local env_file="$SERVICE_PATH/.env.$ENVIRONMENT"
    
    if [[ -f "$env_file" ]]; then
        set -a
        source "$env_file"
        set +a
        log_success "Loaded environment: $ENVIRONMENT"
    else
        log_error "Environment file not found: $env_file"
        exit 1
    fi
}

# Get compose command
get_compose_command() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Execute mongo command
exec_mongo() {
    local command="$1"
    local compose_cmd=$(get_compose_command)
    
    cd "$SERVICE_PATH"
    export NODE_ENV=$ENVIRONMENT
    
    $compose_cmd exec mongo-user-service mongosh \
        --username "${MONGODB_USERNAME:-userservice}" \
        --password "${MONGODB_PASSWORD:-user_mongo_dev_123}" \
        --authenticationDatabase admin \
        "${MONGODB_DB_NAME:-user_service_dev}" \
        --eval "$command"
}

# Check if database container is running
check_database() {
    local compose_cmd=$(get_compose_command)
    
    cd "$SERVICE_PATH"
    export NODE_ENV=$ENVIRONMENT
    
    if ! $compose_cmd ps mongo-user-service | grep -q "Up"; then
        log_error "Database container is not running"
        log_info "Start it with: $compose_cmd up -d mongo-user-service"
        exit 1
    fi
}

# Confirm destructive operation
confirm_destructive() {
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

# Setup database
setup_database() {
    log_info "Setting up database for $ENVIRONMENT..."
    
    check_database
    
    # Create indexes
    log_info "Creating indexes..."
    exec_mongo "
        db.users.createIndex({ 'email': 1 }, { unique: true });
        db.users.createIndex({ 'username': 1 }, { unique: true });
        db.users.createIndex({ 'createdAt': -1 });
        db.users.createIndex({ 'isActive': 1 });
        db.users.createIndex({ 'role': 1 });
        
        print('✅ User indexes created');
        
        // Create other collections if needed
        db.createCollection('sessions');
        db.sessions.createIndex({ 'userId': 1 });
        db.sessions.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });
        
        print('✅ Session collection and indexes created');
    "
    
    log_success "Database setup completed"
}

# Seed database
seed_database() {
    log_info "Seeding database with sample data for $ENVIRONMENT..."
    
    check_database
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_warning "Seeding production database is not recommended"
        if ! confirm_destructive "Continue seeding production database?"; then
            log_info "Seeding cancelled"
            return
        fi
    fi
    
    exec_mongo "
        // Check if users already exist
        if (db.users.countDocuments() > 0) {
            print('⚠️  Users already exist, skipping seed');
        } else {
            print('🌱 Creating sample users...');
            
            const now = new Date();
            const users = [
                {
                    username: 'admin',
                    email: 'admin@aioutlet.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin',
                    isActive: true,
                    emailVerified: true,
                    createdAt: now,
                    updatedAt: now
                },
                {
                    username: 'testuser',
                    email: 'test@aioutlet.com',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'user',
                    isActive: true,
                    emailVerified: true,
                    createdAt: now,
                    updatedAt: now
                },
                {
                    username: 'johndoe',
                    email: 'john.doe@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'user',
                    isActive: true,
                    emailVerified: false,
                    createdAt: now,
                    updatedAt: now
                }
            ];
            
            db.users.insertMany(users);
            print('✅ Sample users created: ' + db.users.countDocuments());
        }
        
        print('🌱 Database seeding completed');
    "
    
    log_success "Database seeding completed"
}

# Reset database
reset_database() {
    log_warning "This will delete ALL data in the database!"
    
    if ! confirm_destructive "Reset database for $ENVIRONMENT environment?"; then
        log_info "Database reset cancelled"
        return
    fi
    
    log_info "Resetting database..."
    
    check_database
    
    exec_mongo "
        print('🗑️  Dropping all collections...');
        db.getCollectionNames().forEach(function(name) {
            if (name !== 'system.indexes') {
                db.getCollection(name).drop();
                print('Dropped: ' + name);
            }
        });
        print('✅ Database reset completed');
    "
    
    log_success "Database reset completed"
    
    # Setup fresh database
    setup_database
    
    # Seed if development
    if [[ "$ENVIRONMENT" == "development" ]]; then
        seed_database
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup for $ENVIRONMENT..."
    
    check_database
    
    local backup_dir="$SERVICE_PATH/database/backups"
    local backup_file="user-service-$ENVIRONMENT-$(date +%Y%m%d_%H%M%S).json"
    local backup_path="$backup_dir/$backup_file"
    
    mkdir -p "$backup_dir"
    
    # Export data
    exec_mongo "
        const collections = db.getCollectionNames();
        const backup = {};
        
        collections.forEach(function(name) {
            if (name !== 'system.indexes') {
                backup[name] = db.getCollection(name).find({}).toArray();
                print('Exported: ' + name + ' (' + backup[name].length + ' documents)');
            }
        });
        
        print('Backup completed');
    " > "$backup_path"
    
    log_success "Backup created: $backup_file"
    log_info "Backup location: $backup_path"
}

# Show database status
show_status() {
    log_info "Database status for $ENVIRONMENT environment:"
    
    check_database
    
    exec_mongo "
        print('📊 Database: ' + db.getName());
        print('📊 Server Status:');
        const stats = db.stats();
        print('   • Collections: ' + stats.collections);
        print('   • Data Size: ' + Math.round(stats.dataSize / 1024) + ' KB');
        print('   • Index Size: ' + Math.round(stats.indexSize / 1024) + ' KB');
        
        print('');
        print('📋 Collections:');
        db.getCollectionNames().forEach(function(name) {
            const count = db.getCollection(name).countDocuments();
            print('   • ' + name + ': ' + count + ' documents');
        });
        
        print('');
        print('👥 Sample Users:');
        db.users.find({}, {username: 1, email: 1, role: 1, isActive: 1}).limit(5).forEach(function(user) {
            print('   • ' + user.username + ' (' + user.email + ') - ' + user.role + (user.isActive ? ' [active]' : ' [inactive]'));
        });
    "
}

# Main execution
main() {
    log_header "============================================"
    log_header "🗄️  User Service Database Management"
    log_header "============================================"
    
    log_info "Operation: $OPERATION"
    log_info "Environment: $ENVIRONMENT"
    echo
    
    load_environment
    
    case $OPERATION in
        setup)
            setup_database
            ;;
        seed)
            seed_database
            ;;
        reset)
            reset_database
            ;;
        backup)
            backup_database
            ;;
        status)
            show_status
            ;;
        *)
            log_error "Unknown operation: $OPERATION"
            show_usage
            exit 1
            ;;
    esac
    
    log_success "✅ Database operation completed!"
}

# Execute main function
main "$@"
