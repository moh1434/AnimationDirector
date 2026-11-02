@echo off
rem  preview-video.bat <project> [--format shorts]  ->  opens Remotion Studio on the project (scrub, inspect, tweak)
cd /d "%~dp0"
set "P=%~1"
if "%P%"=="" set /p "P=Project name: "
call pnpm video plan "%P%" && call pnpm video studio "%P%" %2 %3
pause
