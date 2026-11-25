@echo off
rem Step 1 for this episode: one take per character (library voices berry and benny), cut into lines, then plan.
cd /d "%~dp0..\.."
call pnpm video voices "%~dp0."
if errorlevel 1 goto fail
call pnpm video voice-pick "%~dp0." berry=1 benny=1
if errorlevel 1 goto fail
call pnpm video plan "%~dp0."
if errorlevel 1 goto fail
echo.
echo Done. Now double-click 2-make-video.bat (or tell Claude).
start "" "%~dp0voice-takes\en\review.html"
goto end
:fail
echo.
echo Something went wrong - see the message above, and tell Claude.
:end
pause
