@echo off
rem  new-explainer.bat <name>  ->  creates projects\explainer\<name>\ in explainer mode (Wendy narrates). See EXPLAINER_MODE.md
cd /d "%~dp0"
set "P=%~1"
if "%P%"=="" set /p "P=Name for the new explainer video: "
if "%P%"=="" exit /b 1
call pnpm video new "%P%" --explainer
if not errorlevel 1 start "" "%~dp0projects\explainer\%P%"
pause
