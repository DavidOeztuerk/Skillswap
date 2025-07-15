#!/bin/bash

# Script to run EF Core migrations for all services
# This script should be run from the root directory of the project

echo "🚀 Running EF Core migrations for all services..."

# Set the path to dotnet-ef
export PATH="$PATH:/home/ditss/.dotnet/tools"

# Function to run migration for a service
run_migration() {
    local service_name=$1
    local service_path="src/services/$service_name"
    
    echo "📝 Running migration for $service_name..."
    
    cd "$service_path"
    
    # Run the migration
    dotnet ef database update --project "$service_name.csproj" --startup-project "$service_name.csproj"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration completed successfully for $service_name"
    else
        echo "❌ Migration failed for $service_name"
    fi
    
    cd - > /dev/null
}

# Check if PostgreSQL is running
echo "🔍 Checking if PostgreSQL is running..."
if ! nc -z localhost 5432; then
    echo "❌ PostgreSQL is not running on port 5432"
    echo "Please start PostgreSQL first: docker-compose up postgres"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Run migrations for all services
run_migration "UserService"
run_migration "SkillService"
run_migration "MatchmakingService"
run_migration "AppointmentService"
run_migration "VideocallService"
run_migration "NotificationService"

echo "🎉 All migrations completed!"
echo "📝 Next steps:"
echo "1. Start all services: docker-compose up --build"
echo "2. Check services health: curl http://localhost:8080/health"