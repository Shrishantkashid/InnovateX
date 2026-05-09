@echo off
echo ==========================================
echo   SafeGuard - Start All Services
echo ==========================================

echo.
echo Using deployed Render API...
echo API: https://innovatex-tq7v.onrender.com

echo.
echo Starting Dashboard (Vite)...
start "SafeGuard Dashboard" cmd /k "cd apps\dashboard && npm run dev"

echo.
echo Starting Mobile App (Expo) with Render API...
start "SafeGuard Mobile" cmd /k "cd apps\mobile && set EXPO_PUBLIC_API_URL=https://innovatex-tq7v.onrender.com&& npx expo start -c"

echo.
echo ==========================================
echo   All services are starting in new windows.
echo ==========================================
echo.
echo API: https://innovatex-tq7v.onrender.com/docs
echo Dashboard: http://localhost:5173
echo.
pause
