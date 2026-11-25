@echo off
rem Step 2 for this episode: Claude's direction (direct.mjs), plan with the script's pauses, validate, check, then the Shorts render (no Adobe enhancement).
cd /d "%~dp0..\.."
call node "%~dp0direct.mjs"
if errorlevel 1 goto fail
call pnpm video plan "%~dp0."
if errorlevel 1 goto fail
call node "%~dp0direct.mjs"
if errorlevel 1 goto fail
call pnpm video validate "%~dp0."
if errorlevel 1 goto fail
call pnpm video check "%~dp0." --format shorts
if errorlevel 1 goto fail
call pnpm video make "%~dp0." --format shorts --skip-enhance
if errorlevel 1 goto fail
echo.
echo Done. Tell Claude the video is rendered.
start "" "%~dp0out"
goto end
:fail
echo.
echo Something went wrong - see the message above, and tell Claude.
:end
pause
