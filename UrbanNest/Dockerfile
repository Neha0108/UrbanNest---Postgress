# =========================================
# UrbanNest Backend - ASP.NET Core Web API
# Multi-stage Dockerfile
# =========================================

# ---- Stage 1: Build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj first (layer caching - deps only reinstall if csproj changes)
COPY ["JsonWebToken/UrbanNest.csproj", "JsonWebToken/"]
RUN dotnet restore "JsonWebToken/UrbanNest.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/JsonWebToken"
RUN dotnet build "UrbanNest.csproj" -c Release -o /app/build

# ---- Stage 2: Publish ----
FROM build AS publish
RUN dotnet publish "UrbanNest.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ---- Stage 3: Runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Render/Railway inject PORT env var - ASP.NET Core must listen on it
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "UrbanNest.dll"]
