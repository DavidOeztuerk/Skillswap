FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY shared/ shared/

# Dann kopiere das Gateway-Projekt
COPY services/Gateway/ services/Gateway/

# In das Gateway-Verzeichnis wechseln
WORKDIR /src/services/Gateway

# Restore, build und publish
RUN dotnet restore
RUN dotnet build -c Release -o /app/build
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install envsubst for environment variable substitution
RUN apt-get update && apt-get install -y gettext-base && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

# Copy entrypoint script and config from build context
COPY --from=build /src/services/Gateway/docker-entrypoint.sh /app/
COPY --from=build /src/services/Gateway/ocelot.azure.json /app/

RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]