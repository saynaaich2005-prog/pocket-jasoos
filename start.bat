@echo off
title Pocket Jasoos - Financial Investigator
echo ===================================================
echo     🕵️ POCKET JASOOS - INITIALIZING LOCAL SERVER
echo ===================================================
echo.
echo Checking dependencies...
if not exist node_modules (
    echo Installing node dependencies...
    call npm.cmd install
)
echo.
echo Launching Pocket Jasoos server on http://localhost:3000...
echo (Press Ctrl+C to stop)
echo.
call npm.cmd run dev
pause
