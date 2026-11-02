@echo off
rem Makes THIS project's videos into the out folder next to this file.
rem Options (from a terminal): --draft  --format youtube^|shorts^|both  --replan  --mood epic  --no-music
cd /d "%~dp0..\.."
call pnpm video make "%~dp0." %*
if errorlevel 1 (
  echo.
  echo Something went wrong - see the message above.
) else (
  start "" "%~dp0out"
)
pause
