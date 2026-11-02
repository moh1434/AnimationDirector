@echo off
rem  preview-video.bat <project> [--format shorts]  ->  opens Remotion Studio on the project (scrub, inspect, tweak)
cd /d "%~dp0"
set "P=%~1"
if "%P%"=="" set /p "P=Project name: "
node pipeline\cli.mjs plan "%P%" && node pipeline\cli.mjs studio "%P%" %2 %3
pause
