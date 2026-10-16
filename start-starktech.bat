@echo off
title STARKTECH Intelligence Platform
color 0B

echo =======================================================
echo          STARKTECH INTELLIGENCE PLATFORM               
echo      AI Academy ^& Sentinel Multi-Agent System          
echo =======================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Check if Ollama is running for local AI models
curl -s http://127.0.0.1:11434/api/tags >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Ollama Local AI Engine detected on port 11434.
) else (
    echo [INFO] Ollama is not currently running. 
    echo        STARKTECH will connect via Hugging Face Cloud or built-in AI fallback.
    echo        (To enable offline local GPU acceleration, run: ollama serve)
)

echo.
echo [STARTING] Launching STARKTECH Platform (Port 3000)...
echo [NOTE] Python Multi-Agent Engine (Port 8000) will auto-start in background.
echo.

:: 3. Launch browser after a short delay
start "" http://localhost:3000/STARKTECH.html

:: 4. Start the Node.js Server
node server.js

pause
