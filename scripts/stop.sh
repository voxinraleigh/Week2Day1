#!/usr/bin/env bash
set -euo pipefail

docker stop account-heat-map 2>/dev/null || true
docker rm account-heat-map 2>/dev/null || true

echo "Stopped."
