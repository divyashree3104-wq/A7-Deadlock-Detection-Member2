@echo off
setlocal
cd /d "%~dp0"
if not exist out mkdir out
set PORT=%1
if "%PORT%"=="" set PORT=8080
echo Compiling Member 2 detection project...
javac -d out src\main\java\a7\deadlock\DeadlockDetection.java src\main\java\a7\deadlock\DeadlockServer.java
if errorlevel 1 (
  echo Compilation failed. Check JDK installation and PATH.
  pause
  exit /b 1
)
echo Starting dashboard at http://localhost:%PORT%
java -cp out a7.deadlock.DeadlockServer %PORT%
pause
