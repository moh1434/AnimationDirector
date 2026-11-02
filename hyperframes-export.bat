@echo off
rem  hyperframes-export.bat <project> [--format shorts] [--render]  ->  editable HyperFrames version of the video
cd /d "%~dp0"
set "P=%~1"
if "%P%"=="" set /p "P=Project name: "
node pipeline\cli.mjs hyperframes "%P%" %2 %3 %4
pause
