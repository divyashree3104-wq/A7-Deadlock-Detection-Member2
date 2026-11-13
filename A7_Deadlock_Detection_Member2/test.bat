@echo off
setlocal
cd /d "%~dp0"
if not exist out mkdir out
echo Compiling detection algorithm and tests...
javac -d out src\main\java\a7\deadlock\DeadlockDetection.java src\test\java\a7\deadlock\DetectionSelfTest.java
if errorlevel 1 (
  echo Compilation failed. Check JDK installation and PATH.
  pause
  exit /b 1
)
echo Running self-tests...
java -cp out a7.deadlock.DetectionSelfTest
pause
