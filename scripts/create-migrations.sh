#!/bin/bash

# Script to create EF Core migrations for all services
# This script should be run from the root directory of the project

echo "🚀 Creating EF Core migrations for all services..."

# Set the path to dotnet-ef
export PATH="$PATH:/home/ditss/.dotnet/tools"

# Function to create migration for a service
create_migration() {
    local service_name=$1
    local service_path="src/services/$service_name"
    
    echo "📝 Creating migration for $service_name..."
    
    cd "$service_path"
    
    # Check if migrations directory exists, if not create initial migration
    if [ ! -d "Migrations" ]; then
        echo "Creating initial migration for $service_name..."
        dotnet ef migrations add InitialMigration --project "$service_name.csproj" --startup-project "$service_name.csproj"
    else
        echo "Migrations directory already exists for $service_name"
    fi
    
    cd - > /dev/null
}

# Create migrations for all services
create_migration "UserService"
create_migration "SkillService"
create_migration "MatchmakingService"
create_migration "AppointmentService"
create_migration "VideocallService"
create_migration "NotificationService"

echo "✅ All migrations created successfully!"
echo "📝 Next steps:"
echo "1. Start PostgreSQL: docker-compose up postgres"
echo "2. Run migrations: ./scripts/run-migrations.sh"
echo "3. Start all services: docker-compose up --build"