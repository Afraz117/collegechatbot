Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Starting CampusConnect AI Development Servers   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend in a new window
Write-Host "[1/2] Launching backend server on port 8000..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"

# 2. Start Next.js Frontend in a new window
Write-Host "[2/2] Launching Next.js frontend..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "Both servers are launching in separate windows!" -ForegroundColor Yellow
Write-Host "-> Backend Swagger API Docs: http://localhost:8000/docs" -ForegroundColor Blue
Write-Host "-> Frontend Web Portal:     http://localhost:3000" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Cyan
