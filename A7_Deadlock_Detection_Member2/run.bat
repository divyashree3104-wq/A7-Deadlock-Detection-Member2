
@echo off
setlocal

REM Move to the project folder
cd /d "%~dp0"

REM Create output folder if it does not exist
if not exist out mkdir out

REM Set server port (default: 8080)
set PORT=%1
if "%PORT%"=="" set PORT=8080

echo ==========================================
echo     A7 DEADLOCK DETECTION AND RECOVERY
echo ==========================================
echo.

REM Compile all required Java source files
echo Compiling Java project...

javac -d out ^
    src\main\java\a7\deadlock\DeadlockDetection.java ^
    src\main\java\a7\deadlock\RecoveryService.java ^
    src\main\java\a7\deadlock\DeadlockServer.java

REM Check compilation result
if errorlevel 1 (
    echo.
    echo ERROR: Compilation failed.
    echo Please check the Java files and JDK installation.
    pause
    exit /b 1
)

echo.
echo Compilation successful!
echo.

REM Start the dashboard server
echo Starting dashboard at http://localhost:%PORT%
echo Press Ctrl+C to stop the server.
echo.

java -cp out a7.deadlock.DeadlockServer %PORT%

pause