@echo off
echo ==========================================
echo   SafeGuard - Install All Dependencies
echo ==========================================

echo.
echo [1/3] Installing API dependencies...
cd apps\api
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing API dependencies.
    pause
    exit /b %errorlevel%
)
cd ..\..

echo.
echo [2/3] Installing Dashboard dependencies...
cd apps\dashboard
npm install
if %errorlevel% neq 0 (
    echo Error installing Dashboard dependencies.
    pause
    exit /b %errorlevel%
)
cd ..\..

echo.
echo [3/3] Installing Mobile dependencies...
cd apps\mobile
npm install
if %errorlevel% neq 0 (
    echo Error installing Mobile dependencies.
    pause
    exit /b %errorlevel%
)
cd ..\..

echo.
echo ==========================================
echo   All dependencies installed successfully!
echo ==========================================
pause
