@echo off
rem Makes BOTH videos of THIS project (Shorts + YouTube) into the out folder next to this file.
rem make-short-video.bat / make-landscape-video.bat make just one. Options: --draft --replan --mood epic --no-music
rem find the repository root (the folder with package.json), however deep this project is
cd /d "%~dp0"
:findroot
if exist package.json goto rootfound
if "%cd:~3%"=="" goto rootfound
cd ..
goto findroot
:rootfound
call pnpm video make "%~dp0." --format both %*
if errorlevel 1 (
  echo.
  echo Something went wrong - see the message above.
) else (
  start "" "%~dp0out"
)
pause
