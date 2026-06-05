#!/bin/bash
set -e

echo "Running database migrations..."

cd "$(dirname "$0")/../src/backend"

dotnet ef database update \
  --project Kys.Infrastructure/Kys.Infrastructure.csproj \
  --startup-project Kys.Api/Kys.Api.csproj \
  --configuration Release

echo "Migrations complete."
