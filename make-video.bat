@echo off
rem  make-video.bat <project> [--format youtube|shorts|both] [--draft] [--replan] [--mood curious] [--no-music]
rem  Builds projects\<project>\out\<project>-youtube.mp4 and -shorts.mp4 from voice.wav + script.txt
cd /d "%~dp0"
set "P=%~1"
if "%P%"=="" set /p "P=Project name (folder inside projects\): "
if "%P%"=="" exit /b 1
call pnpm video make "%P%" --format both %2 %3 %4 %5 %6 %7 %8
if errorlevel 1 (echo. & echo Something went wrong - see the message above.)
pause
