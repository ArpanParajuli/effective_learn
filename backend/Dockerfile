# =============================================================================
# Multi-Stage Production Dockerfile for ASP.NET Core 10 LTS API
# Hardened, Unprivileged Non-Root Execution
# =============================================================================

# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy solution and project definitions to optimize layer caching
COPY EffectiveLearn.slnx ./
COPY src/EffectiveLearn.Domain/EffectiveLearn.Domain.csproj src/EffectiveLearn.Domain/
COPY src/EffectiveLearn.Application/EffectiveLearn.Application.csproj src/EffectiveLearn.Application/
COPY src/EffectiveLearn.Infrastructure/EffectiveLearn.Infrastructure.csproj src/EffectiveLearn.Infrastructure/
COPY src/EffectiveLearn.Api/EffectiveLearn.Api.csproj src/EffectiveLearn.Api/
COPY tests/EffectiveLearn.UnitTests/EffectiveLearn.UnitTests.csproj tests/EffectiveLearn.UnitTests/

RUN dotnet restore EffectiveLearn.slnx

# Copy source code and build release binary
COPY src/ src/
COPY tests/ tests/

RUN dotnet test tests/EffectiveLearn.UnitTests/EffectiveLearn.UnitTests.csproj -c Release --no-restore
RUN dotnet publish src/EffectiveLearn.Api/EffectiveLearn.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# Stage 2: Hardened Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install curl for reliable health checks
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Expose standard non-privileged port
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Copy published artifacts
COPY --from=build /app/publish .

# Run under the unprivileged 'app' user
USER app

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "EffectiveLearn.Api.dll"]
