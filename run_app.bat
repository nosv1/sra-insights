@echo off

REM Change to the current directory
cd /d "%~dp0"

REM Get the current directory
set current_dir=%cd%
echo Current directory: %current_dir%

start cmd /c "serve -s build -l 3000"
start cmd /c "node --require ts-node/register .\src\server.ts"