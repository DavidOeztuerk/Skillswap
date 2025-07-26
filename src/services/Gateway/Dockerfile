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
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Gateway.dll"]