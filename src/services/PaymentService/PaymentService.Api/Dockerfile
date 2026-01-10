FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy shared projects first
COPY shared/ shared/

# Then copy the service project
COPY services/PaymentService/ services/PaymentService/

# Change to the service directory
WORKDIR /src/services/PaymentService/PaymentService.Api

# Restore dependencies
RUN dotnet restore

# Build and publish
RUN dotnet build -c Release -o /app/build
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5007
EXPOSE 5007
ENTRYPOINT ["dotnet", "PaymentService.Api.dll"]
