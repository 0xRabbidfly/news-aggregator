# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Get the script's directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start the backend server
Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\backend'; if (-not (Test-Path venv)) { python -m venv venv }; .\venv\Scripts\activate; pip install -r requirements.txt; uvicorn app.main:app --reload"

# Start the frontend development server
Write-Host "Starting frontend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\frontend'; npm install; npm run dev" 