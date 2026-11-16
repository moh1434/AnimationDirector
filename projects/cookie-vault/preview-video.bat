@echo off
rem Opens Remotion Studio on this project (scrub through the video).
cd /d "%~dp0..\.."
call pnpm video plan "%~dp0." && call pnpm video studio "%~dp0." %*
pause
