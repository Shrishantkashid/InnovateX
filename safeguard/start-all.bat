@echo off
echo ==========================================
echo   SafeGuard - Start All Services
echo ==========================================

echo.
echo Starting Backend API (Port 8000)...
start "SafeGuard API" cmd /k "cd apps\api && python -m uvicorn main:app --reload --port 8000"

echo.
echo Starting Dashboard (Vite)...
start "SafeGuard Dashboard" cmd /k "cd apps\dashboard && npm run dev"

echo.
echo Starting Mobile App (Expo)...
start "SafeGuard Mobile" cmd /k "cd apps\mobile && npx expo start --offline -c"

echo.
echo ==========================================
echo   All services are starting in new windows.
echo ==========================================
echo.
echo API: http://localhost:8000/docs
echo Dashboard: http://localhost:5173
echo.
pause
