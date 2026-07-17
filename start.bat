@echo off
echo ========================================
echo   LLM Learning Dashboard
echo   大模型学习路线管理工具
echo ========================================
echo.
echo [1/2] Starting backend server...
start "LLM-Dashboard-Backend" cmd /c "cd /d "%~dp0backend" && C:\ProgramData\anaconda3\Scripts\activate.bat base && uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/2] Starting frontend dev server...
start "LLM-Dashboard-Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5173
pause
