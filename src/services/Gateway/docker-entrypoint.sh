#!/bin/sh

# Replace environment variables in ocelot.azure.json
if [ -f "/app/ocelot.azure.json" ]; then
    echo "Replacing environment variables in ocelot.azure.json..."
    
    # Set defaults if not provided
    export SERVICE_SCHEME="${SERVICE_SCHEME:-http}"
    export USERSERVICE_HOST="${USERSERVICE_HOST:-userservice}"
    export USERSERVICE_PORT="${USERSERVICE_PORT:-5001}"
    export SKILLSERVICE_HOST="${SKILLSERVICE_HOST:-skillservice}"
    export SKILLSERVICE_PORT="${SKILLSERVICE_PORT:-5002}"
    export MATCHMAKINGSERVICE_HOST="${MATCHMAKINGSERVICE_HOST:-matchmakingservice}"
    export MATCHMAKINGSERVICE_PORT="${MATCHMAKINGSERVICE_PORT:-5003}"
    export APPOINTMENTSERVICE_HOST="${APPOINTMENTSERVICE_HOST:-appointmentservice}"
    export APPOINTMENTSERVICE_PORT="${APPOINTMENTSERVICE_PORT:-5004}"
    export NOTIFICATIONSERVICE_HOST="${NOTIFICATIONSERVICE_HOST:-notificationservice}"
    export NOTIFICATIONSERVICE_PORT="${NOTIFICATIONSERVICE_PORT:-5006}"
    export VIDEOCALLSERVICE_HOST="${VIDEOCALLSERVICE_HOST:-videocallservice}"
    export VIDEOCALLSERVICE_PORT="${VIDEOCALLSERVICE_PORT:-5005}"
    export GATEWAY_BASE_URL="${GATEWAY_BASE_URL:-http://localhost:8080}"
    
    # Use envsubst to replace variables
    envsubst < /app/ocelot.azure.json > /app/ocelot.azure.tmp.json
    mv /app/ocelot.azure.tmp.json /app/ocelot.azure.json
    
    echo "Environment variables replaced successfully"
fi

# Start the application
exec dotnet Gateway.dll