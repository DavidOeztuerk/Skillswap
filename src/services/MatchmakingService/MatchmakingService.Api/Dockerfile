FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Kopiere zuerst die gemeinsam genutzten Projekte
COPY shared/ shared/

# Dann kopiere das Service-Projekt
COPY services/MatchmakingService/ services/MatchmakingService/

# In das Service-Verzeichnis wechseln
WORKDIR /src/services/MatchmakingService

# Restore Abhängigkeiten
RUN dotnet restore

# Build und publish
RUN dotnet build -c Release -o /app/build
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5003
EXPOSE 5003
ENTRYPOINT ["dotnet", "MatchmakingService.dll"]