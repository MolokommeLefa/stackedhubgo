
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy backend projects
COPY backend/ ./backend/

# Restore and publish the API
RUN dotnet restore backend/StackedHub.Api/StackedHub.Api.csproj
RUN dotnet publish backend/StackedHub.Api/StackedHub.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Render provides the PORT environment variable
ENV ASPNETCORE_URLS=http://0.0.0.0:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "StackedHub.Api.dll"]
