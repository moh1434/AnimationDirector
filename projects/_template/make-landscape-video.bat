@echo off
rem Makes only the YouTube landscape (16:9) video of THIS project (name-youtube.mp4) into the out folder.
rem make-video.bat makes both formats. Options (from a terminal): --draft  --replan  --mood epic  --no-music
rem find the repository root (the folder with package.json), however deep this project is
cd /d "%~dp0"
:findroot
if exist package.json goto rootfound
if "%cd:~3%"=="" goto rootfound
cd ..
goto findroot
:rootfound
call pnpm video make "%~dp0." --format youtube %*
if errorlevel 1 (
  echo.
  echo Something went wrong - see the message above.
) else (
  start "" "%~dp0out"
)
pause
