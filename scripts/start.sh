#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE_NAME="account-heat-map"
CONTAINER_NAME="account-heat-map"
DATA_DIR="$(pwd)/backend/data"

mkdir -p "$DATA_DIR"

docker build -t "$IMAGE_NAME" .
docker run -d \
  --name "$CONTAINER_NAME" \
  -p 8000:8000 \
  -v "$DATA_DIR:/app/backend/data" \
  "$IMAGE_NAME"

echo "Account Heat Map running at http://localhost:8000"
