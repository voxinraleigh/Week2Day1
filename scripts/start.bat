@echo off
setlocal
cd /d "%~dp0.."

set IMAGE_NAME=account-heat-map
set CONTAINER_NAME=account-heat-map
set DATA_DIR=%cd%\backend\data

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

docker build -t %IMAGE_NAME% .
docker run -d --name %CONTAINER_NAME% -p 8000:8000 -v "%DATA_DIR%:/app/backend/data" %IMAGE_NAME%

echo Account Heat Map running at http://localhost:8000
