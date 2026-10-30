@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Наше небо: http://localhost:8080
echo Закрой это окно, чтобы остановить сервер.
start "" http://localhost:8080
node server.js
