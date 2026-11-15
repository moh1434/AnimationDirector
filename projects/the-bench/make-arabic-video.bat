@echo off
rem Makes the ARABIC version of THIS project (Shorts) into projects\<this name>-ar\out.
rem Needs voice-ar.wav and script-ar.txt (same sentences, same order) next to voice.wav and script.txt.
rem On-screen text (titles, labels) comes from projects\<this name>-ar\translations.json.
cd /d "%~dp0..\.."
for %%I in ("%~dp0.") do set "N=%%~nxI"
call pnpm video localize "%~dp0." --lang ar --make
if errorlevel 1 (
  echo.
  echo Something went wrong - see the message above.
) else (
  start "" "%~dp0..\%N%-ar\out"
)
pause
