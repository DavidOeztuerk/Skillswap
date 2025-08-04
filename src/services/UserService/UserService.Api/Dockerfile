FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Kopiere zuerst die gemeinsam genutzten Projekte
COPY shared/ shared/

# Dann kopiere das Service-Projekt
COPY services/UserService/ services/UserService/

# In das Service-Verzeichnis wechseln
WORKDIR /src/services/UserService/UserService.Api

# Restore Abhängigkeiten
RUN dotnet restore

# Build und publish
RUN dotnet build -c Release -o /app/build
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5001
EXPOSE 5001
ENTRYPOINT ["dotnet", "UserService.Api.dll"]



