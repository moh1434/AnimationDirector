@echo off
rem Makes only the Shorts / Reels / TikTok (9:16) video of THIS project (name-shorts.mp4) into the out folder.
rem make-video.bat makes both formats. Options (from a terminal): --draft  --replan  --mood epic  --no-music
cd /d "%~dp0..\.."
call pnpm video make "%~dp0." --format shorts %*
if errorlevel 1 (
  echo.
  echo Something went wrong - see the message above.
) else (
  start "" "%~dp0out"
)
pause
