@echo off
rem Makes BOTH videos of THIS project (Shorts + YouTube) into the out folder next to this file.
rem make-short-video.bat / make-landscape-video.bat make just one. Options: --draft --replan --mood epic --no-music
cd /d "%~dp0..\.."
call pnpm video make "%~dp0." --format both %*
if errorlevel 1 (
  echo.
  echo Something went wrong - see the message above.
) else (
  start "" "%~dp0out"
)
pause
