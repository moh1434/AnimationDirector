@echo off
rem Opens Remotion Studio on this project (scrub through the video).
rem find the repository root (the folder with package.json), however deep this project is
cd /d "%~dp0"
:findroot
if exist package.json goto rootfound
if "%cd:~3%"=="" goto rootfound
cd ..
goto findroot
:rootfound
call pnpm video plan "%~dp0." && call pnpm video studio "%~dp0." %*
pause
