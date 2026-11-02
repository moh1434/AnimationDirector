@echo off
rem  stills.bat <project> [--format shorts]  ->  quick contact sheet of every scene (out\contact-*.jpg), no full render
cd /d "%~dp0"
set "P=%~1"
if "%P%"=="" set /p "P=Project name: "
node pipeline\cli.mjs plan "%P%" && node pipeline\cli.mjs stills "%P%" %2 %3
if not errorlevel 1 start "" "%~dp0projects\%P%\out"
pause
