@echo off
rem  new-video.bat <name>  ->  creates projects\<name>\ with script.txt and video.json to fill in
cd /d "%~dp0"
set "P=%~1"
if "%P%"=="" set /p "P=Name for the new video project: "
if "%P%"=="" exit /b 1
call pnpm video new "%P%"
if not errorlevel 1 start "" "%~dp0projects\%P%"
pause
