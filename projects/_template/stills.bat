@echo off
rem Quick check: one picture per scene (out\contact-*.jpg), no full render.
rem find the repository root (the folder with package.json), however deep this project is
cd /d "%~dp0"
:findroot
if exist package.json goto rootfound
if "%cd:~3%"=="" goto rootfound
cd ..
goto findroot
:rootfound
call pnpm video plan "%~dp0." && call pnpm video stills "%~dp0." %*
if not errorlevel 1 start "" "%~dp0out"
pause
