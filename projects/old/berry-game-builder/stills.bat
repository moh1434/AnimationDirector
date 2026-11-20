@echo off
rem Quick check: one picture per scene (out\contact-*.jpg), no full render.
cd /d "%~dp0..\.."
call pnpm video plan "%~dp0." && call pnpm video stills "%~dp0." %*
if not errorlevel 1 start "" "%~dp0out"
pause
